/**
 * Mô hình lịch PT sau BE V85: GYM khai ca cho chi nhánh và xếp PT vào ca; PT
 * chỉ đọc lịch ca của mình và gửi đơn xin nghỉ.
 *
 * Thay hoàn toàn khái niệm "PT tự khai khung giờ rảnh" — không còn kiểu dữ liệu
 * nào của mô hình cũ ở đây.
 */

/** ISO-8601: 1 = Thứ hai ... 7 = Chủ nhật. Khớp OperatingHour của chi nhánh. */
export type IsoDayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface GymShift {
  id: number;
  branchId: number;
  branchName?: string | null;
  name: string;
  startTime: string;
  endTime: string;
  /** Độ dài một slot khách đặt được. Giờ kết thúc buổi do CA quyết, không do PT. */
  slotMinutes: number;
  daysOfWeek: number[];
  active: boolean;
  /** Số khung giờ khách đặt được mỗi lần lên ca — BE tính sẵn. */
  slotCount: number;
}

export interface GymShiftInput {
  name: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  daysOfWeek: number[];
  active?: boolean;
}

export type ShiftSource = "RECURRING" | "MANUAL";

/** Một ô của lưới phân ca (hàng = PT, cột = ngày). BE trả phẳng, FE tự gom. */
export interface ShiftRosterCell {
  assignmentId: number;
  ptProfileId: number;
  ptName?: string | null;
  date: string;
  shiftId: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  source?: ShiftSource | null;
  active: boolean;
  /** PT đã được duyệt nghỉ ca này. */
  onLeave: boolean;
  /** Số buổi khách đã đặt trong ca — phải thấy trước khi định gỡ ca. */
  bookedSessions: number;
}

export interface PtShiftAssignInput {
  shiftId: number;
  from: string;
  to: string;
  /** Bỏ trống = mọi thứ trong tuần mà ca đó áp dụng. from === to là xếp lẻ một ngày. */
  daysOfWeek?: number[];
}

/**
 * Kết quả một lượt xếp ca. Phần BỊ BỎ QUA cũng được trả về — Gym bấm "xếp cả
 * tháng" mà chi nhánh nghỉ Chủ nhật thì phải thấy rõ, không được im lặng.
 */
export interface PtShiftAssignResult {
  created: number;
  alreadyAssigned: string[];
  skippedClosed: string[];
  skippedOverlap: string[];
}

/** Lịch ca của chính PT — READ-ONLY. */
export interface PtShift {
  date: string;
  shiftId: number;
  shiftName: string;
  branchId: number;
  branchName?: string | null;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  onLeave: boolean;
  bookedSessions: number;
}

export type LeaveType = "LEAVE" | "SICK" | "BUSY" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LeaveScope = "FULL_DAY" | "SHIFT" | "TIME_RANGE";

export interface PtLeaveRequest {
  id: number;
  ptProfileId?: number | null;
  ptName?: string | null;
  type: LeaveType;
  scope: LeaveScope;
  fromDate: string;
  toDate: string;
  startTime?: string | null;
  endTime?: string | null;
  shiftIds?: number[];
  shiftNames?: string[];
  reason: string;
  attachmentUrl?: string | null;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  createdAt?: string | null;
}

export interface PtLeaveRequestInput {
  type: LeaveType;
  scope: LeaveScope;
  fromDate: string;
  toDate: string;
  /** Bắt buộc khi scope = SHIFT. */
  shiftIds?: number[];
  /** Bắt buộc khi scope = TIME_RANGE. */
  startTime?: string;
  endTime?: string;
  reason: string;
  attachmentUrl?: string;
}

/**
 * Hạn mức đơn nghỉ mỗi tháng của một PT, do Gym đặt và bật-tắt được.
 * enabled = false (mặc định) nghĩa là không giới hạn.
 */
export interface GymLeavePolicy {
  enabled: boolean;
  monthlyQuota?: number | null;
}
