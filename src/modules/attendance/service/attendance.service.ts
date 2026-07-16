import { AppError, ConflictError, ForbiddenError } from '../../../shared/errors/index.js';
import { ATTENDANCE_TYPES, USER_ROLES } from '../../../shared/constants/index.js';
import { settingsRepository } from '../../../shared/repositories/settings.repository.js';
import { activityLogRepository } from '../../../shared/repositories/activity-log.repository.js';
import { broadcastTableChange } from '../../../shared/realtime/broadcast.js';
import { usersRepository } from '../../users/repository/users.repository.js';
import type { AuthenticatedUser } from '../../../types/auth.types.js';
import { attendanceRepository } from '../repository/attendance.repository.js';
import { mapAttendanceRecord, mapDbAttendance } from '../dto/attendance.mapper.js';
import {
  groupAttendanceByDay,
  paginateDailyRecords,
} from '../utils/attendance-grouping.js';
import {
  CLOCK_GRACE_MINUTES,
  CLOCK_RADIUS_METERS,
  HALF_SHIFT_HOURS,
  evaluateGeofence,
  getClockOutAvailableAt,
  isClockInScheduleOpen,
  isClockOutScheduleOpen,
  isLateCheckIn,
  type AssignedProjectLocation,
} from '../utils/clock-rules.js';
import {
  getTodayWorkDateRangeIso,
  getWorkDateKey as toWorkDateKey,
  getWorkDateRangeIso,
} from '../../../shared/time/work-timezone.js';
import type {
  AttendanceHistoryQuery,
  AttendanceMarkInput,
  AttendanceRecord,
  PaginatedAttendance,
  PaginatedDailyAttendance,
  TodayAttendanceStatus,
} from '../types/attendance.types.js';

export class AttendanceService {
  async checkIn(
    userId: string,
    input: AttendanceMarkInput,
    ip?: string,
  ): Promise<AttendanceRecord> {
    const today = this.getTodayRange();

    const existingCheckIn = await attendanceRepository.findLatestByUserAndType(
      userId,
      ATTENDANCE_TYPES.CHECK_IN,
      today.start,
      today.end,
    );
    const existingLate = await attendanceRepository.findLatestByUserAndType(
      userId,
      ATTENDANCE_TYPES.LATE,
      today.start,
      today.end,
    );

    if (existingCheckIn || existingLate) {
      throw new ConflictError('Already checked in today');
    }

    const officeSettings = await settingsRepository.getOfficeConfig();
    const user = await usersRepository.findById(userId);
    const workStartTime = user?.work_start_time || officeSettings.workStartTime;

    if (!isClockInScheduleOpen(workStartTime)) {
      throw new AppError(
        `Clock-in opens at ${workStartTime} Qatar time. Please wait until your scheduled check-in time.`,
        400,
        'CLOCK_IN_TOO_EARLY',
      );
    }

    const assigned = this.getAssignedLocation(user);
    if (!assigned) {
      throw new AppError(
        'No project location assigned. Ask Admin/HR to pin your site on the map first.',
        400,
        'NO_ASSIGNED_LOCATION',
      );
    }

    const geo = evaluateGeofence(input.latitude, input.longitude, assigned);
    if (!geo.isWithinRadius) {
      throw new AppError(
        `You must be within ${CLOCK_RADIUS_METERS}m of your assigned location to clock in. Current distance: ${geo.distanceMeters}m.`,
        400,
        'OUTSIDE_GEOFENCE',
      );
    }

    const late = isLateCheckIn(workStartTime, CLOCK_GRACE_MINUTES);
    const type = late ? ATTENDANCE_TYPES.LATE : ATTENDANCE_TYPES.CHECK_IN;

    const record = await attendanceRepository.create({
      userId,
      type,
      latitude: input.latitude,
      longitude: input.longitude,
      address: this.formatLocationAddress(input.address, input.latitude, input.longitude),
      device: input.device,
      browser: input.browser,
      distanceFromOffice: geo.distanceMeters,
      isWithinRadius: true,
    });

    await activityLogRepository.create({
      userId,
      action: 'attendance.check_in',
      entityType: 'attendance',
      entityId: record.id,
      metadata: {
        type,
        latitude: input.latitude,
        longitude: input.longitude,
        distanceMeters: geo.distanceMeters,
      },
      ip,
    });

    void broadcastTableChange('attendance');
    return mapAttendanceRecord(record);
  }

  async checkOut(
    userId: string,
    input: AttendanceMarkInput,
    ip?: string,
  ): Promise<AttendanceRecord> {
    const today = this.getTodayRange();

    const checkIn =
      (await attendanceRepository.findLatestByUserAndType(
        userId,
        ATTENDANCE_TYPES.CHECK_IN,
        today.start,
        today.end,
      )) ??
      (await attendanceRepository.findLatestByUserAndType(
        userId,
        ATTENDANCE_TYPES.LATE,
        today.start,
        today.end,
      ));

    if (!checkIn) {
      throw new ConflictError('Must check in before checking out');
    }

    const existingCheckout = await attendanceRepository.findLatestByUserAndType(
      userId,
      ATTENDANCE_TYPES.CHECK_OUT,
      today.start,
      today.end,
    );

    if (existingCheckout) {
      throw new ConflictError('Already checked out today');
    }

    if (!isClockOutScheduleOpen(checkIn.marked_at)) {
      const availableAt = getClockOutAvailableAt(checkIn.marked_at);
      throw new AppError(
        `Clock-out opens ${HALF_SHIFT_HOURS} hours after clock-in (from ${availableAt.toLocaleTimeString('en-QA', { hour: '2-digit', minute: '2-digit' })}).`,
        400,
        'CLOCK_OUT_TOO_EARLY',
      );
    }

    const user = await usersRepository.findById(userId);
    const assigned = this.getAssignedLocation(user);
    if (!assigned) {
      throw new AppError(
        'No project location assigned. Ask Admin/HR to pin your site on the map first.',
        400,
        'NO_ASSIGNED_LOCATION',
      );
    }

    const geo = evaluateGeofence(input.latitude, input.longitude, assigned);
    if (!geo.isWithinRadius) {
      throw new AppError(
        `You must be within ${CLOCK_RADIUS_METERS}m of your assigned location to clock out. Current distance: ${geo.distanceMeters}m.`,
        400,
        'OUTSIDE_GEOFENCE',
      );
    }

    const record = await attendanceRepository.create({
      userId,
      type: ATTENDANCE_TYPES.CHECK_OUT,
      latitude: input.latitude,
      longitude: input.longitude,
      address: this.formatLocationAddress(input.address, input.latitude, input.longitude),
      device: input.device,
      browser: input.browser,
      distanceFromOffice: geo.distanceMeters,
      isWithinRadius: true,
    });

    await activityLogRepository.create({
      userId,
      action: 'attendance.check_out',
      entityType: 'attendance',
      entityId: record.id,
      metadata: {
        latitude: input.latitude,
        longitude: input.longitude,
        distanceMeters: geo.distanceMeters,
      },
      ip,
    });

    void broadcastTableChange('attendance');
    return mapAttendanceRecord(record);
  }

  async getHistory(
    query: AttendanceHistoryQuery,
    actor: AuthenticatedUser,
  ): Promise<PaginatedAttendance> {
    let scopedUserId: string | undefined;

    if (actor.role === USER_ROLES.EMPLOYEE) {
      scopedUserId = actor.id;
    } else if (query.userId) {
      scopedUserId = query.userId;
    }

    if (actor.role === USER_ROLES.EMPLOYEE && query.userId && query.userId !== actor.id) {
      throw new ForbiddenError('Cannot view other users attendance');
    }

    const includeUser = actor.role !== USER_ROLES.EMPLOYEE;
    const { records, total } = await attendanceRepository.findHistory(query, scopedUserId);

    return {
      records: records.map((r) => mapAttendanceRecord(r, includeUser)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  async getDailyHistory(
    query: AttendanceHistoryQuery,
    actor: AuthenticatedUser,
  ): Promise<PaginatedDailyAttendance> {
    let scopedUserId: string | undefined;

    if (actor.role === USER_ROLES.EMPLOYEE) {
      scopedUserId = actor.id;
    } else if (query.userId) {
      scopedUserId = query.userId;
    }

    if (actor.role === USER_ROLES.EMPLOYEE && query.userId && query.userId !== actor.id) {
      throw new ForbiddenError('Cannot view other users attendance');
    }

    await this.reconcileMissingClockOuts(scopedUserId);

    const includeUser = actor.role !== USER_ROLES.EMPLOYEE;
    const rawRecords = await attendanceRepository.findAllForDailySummary(
      {
        userId: query.userId,
        type: query.type,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      scopedUserId,
    );

    const grouped = groupAttendanceByDay(rawRecords.map((r) => mapAttendanceRecord(r, includeUser)));
    const paginated = paginateDailyRecords(grouped, query.page, query.limit);

    return {
      records: paginated.records,
      total: paginated.total,
      page: query.page,
      limit: query.limit,
      totalPages: paginated.totalPages,
    };
  }

  async getToday(userId: string): Promise<TodayAttendanceStatus> {
    await this.reconcileMissingClockOuts(userId);

    const today = this.getTodayRange();
    const officeSettings = await settingsRepository.getOfficeConfig();
    const user = await usersRepository.findById(userId);
    const workStartTime = user?.work_start_time || officeSettings.workStartTime;
    const workEndTime = user?.work_end_time || officeSettings.workEndTime;
    const assigned = this.getAssignedLocation(user);

    const checkInRecord =
      (await attendanceRepository.findLatestByUserAndType(
        userId,
        ATTENDANCE_TYPES.CHECK_IN,
        today.start,
        today.end,
      )) ??
      (await attendanceRepository.findLatestByUserAndType(
        userId,
        ATTENDANCE_TYPES.LATE,
        today.start,
        today.end,
      ));

    const checkOutRecord = await attendanceRepository.findLatestByUserAndType(
      userId,
      ATTENDANCE_TYPES.CHECK_OUT,
      today.start,
      today.end,
    );

    const absentRecord = await attendanceRepository.findLatestByUserAndType(
      userId,
      ATTENDANCE_TYPES.ABSENT,
      today.start,
      today.end,
    );

    const checkIn = checkInRecord ? mapDbAttendance(checkInRecord) : null;
    const checkOut = checkOutRecord ? mapDbAttendance(checkOutRecord) : null;
    const now = new Date();
    const scheduleOpen = isClockInScheduleOpen(workStartTime, now);
    const clockOutAvailableAt = checkIn ? getClockOutAvailableAt(checkIn.markedAt).toISOString() : null;
    const halfTimeReached = checkIn ? isClockOutScheduleOpen(checkIn.markedAt, now) : false;

    return {
      checkedIn: Boolean(checkIn),
      checkedOut: Boolean(checkOut),
      checkIn,
      checkOut,
      workStartTime,
      workEndTime,
      graceMinutes: CLOCK_GRACE_MINUTES,
      halfShiftHours: HALF_SHIFT_HOURS,
      clockRadiusMeters: CLOCK_RADIUS_METERS,
      hasAssignedLocation: Boolean(assigned),
      assignedLocation: assigned,
      clockInScheduleOpen: scheduleOpen,
      clockOutScheduleOpen: halfTimeReached,
      clockOutAvailableAt,
      isAbsent: Boolean(absentRecord),
      checkInClassification: checkIn
        ? checkIn.type === 'late'
          ? 'late'
          : 'on_time'
        : scheduleOpen
          ? isLateCheckIn(workStartTime, CLOCK_GRACE_MINUTES, now)
            ? 'late'
            : 'on_time'
          : null,
    };
  }

  /**
   * If a user checked in but never checked out, mark the prior day(s) as absent.
   */
  private async reconcileMissingClockOuts(scopedUserId?: string): Promise<void> {
    const today = this.getTodayRange();
    const lookbackStart = new Date();
    lookbackStart.setDate(lookbackStart.getDate() - 14);

    const raw = await attendanceRepository.findAllForDailySummary(
      {
        userId: scopedUserId,
        startDate: lookbackStart.toISOString(),
        endDate: today.start,
      },
      scopedUserId,
    );

    const mapped = raw.map((r) => mapAttendanceRecord(r, false));
    const days = groupAttendanceByDay(mapped);

    for (const day of days) {
      if (day.date >= this.getWorkDateKey(new Date())) continue;
      if (!day.checkIn || day.checkOut) continue;

      const dayRange = this.getDateRangeForWorkDate(day.date);
      const existingAbsent = await attendanceRepository.findLatestByUserAndType(
        day.userId,
        ATTENDANCE_TYPES.ABSENT,
        dayRange.start,
        dayRange.end,
      );
      if (existingAbsent) continue;

      await attendanceRepository.create({
        userId: day.userId,
        type: ATTENDANCE_TYPES.ABSENT,
        latitude: day.checkIn.latitude ?? 0,
        longitude: day.checkIn.longitude ?? 0,
        address: 'Auto-marked absent: no clock-out',
        device: null,
        browser: null,
        distanceFromOffice: null,
        isWithinRadius: null,
        markedAt: new Date(dayRange.end),
      });
    }
  }

  private getAssignedLocation(
    user: Awaited<ReturnType<typeof usersRepository.findById>>,
  ): AssignedProjectLocation | null {
    if (user?.project_latitude == null || user?.project_longitude == null) {
      return null;
    }

    return {
      latitude: Number(user.project_latitude),
      longitude: Number(user.project_longitude),
      radiusMeters: CLOCK_RADIUS_METERS,
    };
  }

  private formatLocationAddress(
    address: string | undefined,
    latitude: number,
    longitude: number,
  ): string {
    return address ?? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  private getTodayRange(): { start: string; end: string } {
    return getTodayWorkDateRangeIso();
  }

  private getWorkDateKey(date: Date): string {
    return toWorkDateKey(date);
  }

  private getDateRangeForWorkDate(dateKey: string): { start: string; end: string } {
    return getWorkDateRangeIso(dateKey);
  }
}

export const attendanceService = new AttendanceService();
