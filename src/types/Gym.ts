import type { PageResponse } from "@/shared/types/api-response.type";
import type { PlaceProvider } from "@/services/marketplace.service";
import type { Media } from "@/types/Media";

export interface Gym {
  id?: number;
  name?: string;
  description?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverUrl?: string;
  averageRating?: number;
  status?: string;
  [key: string]: unknown;
}

export interface GymRequest {
  name: string;
  description?: string;
  city: string;
  district: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface GymBranch {
  id?: number;
  gymId?: number;
  name?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface BranchRequest {
  name: string;
  address: string;
  city?: string;
  district?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface GymFacility {
  id?: number;
  gymId?: number;
  name?: string;
  type: FacilityType;
  description?: string;
  iconUrl?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export interface FacilityRequest {
  name: string;
  type?: FacilityType;
  description?: string;
  iconUrl?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export type FacilityType =
  | "EQUIPMENT"
  | "AMENITY"
  | "CLASS_ROOM"
  | "LOCKER_ROOM"
  | "SHOWER"
  | "PARKING"
  | "WIFI"
  | "OTHER";

export interface GymPartnership {
  id?: number;
  gymId?: number;
  gymName?: string;
  profileId?: number;
  ptProfileId?: number;
  ptName?: string;
  requestMessage?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PartnershipActionRequest {
  message?: string;
}

export type GymPage = PageResponse<Gym>;
export type BranchPage = PageResponse<GymBranch>;
export type FacilityPage = PageResponse<GymFacility>;
export type PartnershipPage = PageResponse<GymPartnership>;

// B-5 (audit 2026-07-17): khớp đủ enum VerificationStatus của BE — thiếu
// REQUIRES_INFO/SUSPENDED từng làm gãy luồng "yêu cầu bổ sung -> nộp lại".
export type GymVerificationStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REQUIRES_INFO"
  | "SUSPENDED";

export interface GymDocumentDto {
  /** Server set khi trả về — cần cho DELETE /gym/documents/{id} (UC-012). */
  id?: number;
  documentType: string;
  fileUrl: string;
}

export interface SubmitGymRegistrationRequest {
  gymName: string;
  description?: string;
  address?: string;
  city?: string;
  /** UC-18: quận/huyện — BE ghép vào chuỗi geocode, thiếu thì dễ khớp nhầm phường trùng tên. */
  district?: string;
  phone?: string;
  /**
   * UC-18 (V55): toạ độ chọn từ gợi ý địa chỉ. Bỏ trống thì BE geocode từ địa chỉ;
   * gửi kèm sẽ ghi đè — vị trí dịch vụ trả về cho đúng địa điểm chính xác hơn
   * việc geocode lại chuỗi chữ.
   */
  latitude?: number;
  longitude?: number;
  /**
   * Metadata của chính gợi ý địa chỉ đã chọn. Gửi kèm toạ độ để BE khỏi phải
   * geocode lại chỉ nhằm lấy hai giá trị FE đang cầm sẵn; bỏ trống thì BE giữ
   * nguyên giá trị đang lưu.
   */
  placeId?: string;
  /** V65 — dịch vụ đã cấp `placeId`; thiếu nó thì job làm mới toạ độ bỏ qua bản ghi. */
  placeProvider?: PlaceProvider;
  formattedAddress?: string;
  /** UC-18 (V60): toạ độ do chủ gym kéo ghim tay — job làm mới định kỳ sẽ bỏ qua. */
  coordinatesPinned?: boolean;
  documents: GymDocumentDto[];
}

// B-10: khớp GymProfileResponse BE — thêm id/username/reviewNote/active.
export interface GymVerificationStatusResponse {
  id?: number;
  username?: string;
  verificationStatus?: GymVerificationStatus;
  gymName?: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  /**
   * UC-18 (V55): toạ độ đang lưu. Form phải nạp lại và gửi nguyên vẹn khi lưu —
   * bỏ đi thì BE coi như operator chưa ghim và geocode lại một địa chỉ không đổi.
   */
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  /** UC-18 (V60): toạ độ do chủ gym kéo ghim tay — form phải gửi lại khi lưu. */
  coordinatesPinned?: boolean;
  documents?: GymDocumentDto[];
  rejectionReason?: string;
  /** Ghi chú của admin khi request-info / suspend. */
  reviewNote?: string;
  /** Bug S2-01: false = admin đã yêu cầu xác minh lại địa chỉ (gym vẫn hoạt động). */
  addressVerified?: boolean;
  addressReviewNote?: string;
  /** Đang hiển thị trên marketplace hay không (UC-018). */
  active?: boolean;
}

// ── Gym operator workspace — flat endpoints scoped to the authenticated operator ──

// UC-027: trạng thái catalog của service/package (khớp BE CatalogStatus).
export type CatalogStatus = "PUBLISHED" | "HIDDEN" | "PAUSED" | "ARCHIVED";

/** UC-026: quy tắc đặt lịch của service/package (BookingRulesDto BE). */
export interface BookingRules {
  /** % đặt cọc (0-100); null = thanh toán đủ. */
  depositPercent?: number | null;
  /** Số giờ trước buổi tập được hủy miễn phí. */
  freeCancellationHours?: number | null;
  /** Số giờ tối thiểu phải đặt trước. */
  minNoticeHours?: number | null;
}

export interface BranchResponse {
  id?: number;
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  /** B-14: tiện ích, phân tách dấu phẩy (vd "Parking,Sauna"). */
  amenities?: string;
  /** B-14/UC-017: sức chứa tối đa; null = không giới hạn. */
  capacity?: number;
  active?: boolean;
  /** UC-18 (V55): toạ độ chi nhánh — BE tự geocode từ địa chỉ nếu không gửi lên. */
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  /** UC-18 (V60): toạ độ do chủ gym kéo ghim tay — form phải gửi lại khi lưu. */
  coordinatesPinned?: boolean;
}

export interface BranchInput {
  name: string;
  address?: string;
  city?: string;
  /**
   * UC-18: BE geocode "address, district, city, Việt Nam" — thiếu district thì
   * chuỗi tra cứu yếu hẳn ở những tên đường trùng nhau giữa các quận.
   */
  district?: string;
  phone?: string;
  // B-13 (DATA LOSS): BE set vô điều kiện 2 field này khi update —
  // thiếu chúng trong payload là xóa trắng dữ liệu đã có.
  amenities?: string;
  capacity?: number;
  /**
   * UC-18 (V55): toạ độ chọn từ gợi ý địa chỉ. Bỏ trống thì BE geocode từ địa chỉ;
   * gửi kèm sẽ ghi đè — chủ gym biết vị trí thật chính xác hơn máy đoán.
   */
  latitude?: number;
  longitude?: number;
  /** Metadata của gợi ý địa chỉ đi kèm toạ độ; bỏ trống thì BE giữ nguyên giá trị đang lưu. */
  placeId?: string;
  /** V65 — dịch vụ đã cấp `placeId`; thiếu nó thì job làm mới toạ độ bỏ qua bản ghi. */
  placeProvider?: PlaceProvider;
  formattedAddress?: string;
  /** UC-18 (V60): toạ độ do chủ gym kéo ghim tay — job làm mới định kỳ sẽ bỏ qua. */
  coordinatesPinned?: boolean;
}

export interface FacilityResponse {
  id?: number;
  name?: string;
  description?: string;
  /** B-14: chi nhánh chứa cơ sở vật chất. */
  branchId?: number;
  branchName?: string;
  active?: boolean;
  /** Ảnh minh hoạ (media FACILITY/GALLERY) theo thứ tự thư viện. */
  images?: Media[];
  /** Ảnh đại diện đã chọn sẵn ở BE — dùng cho thumbnail trên card. */
  imageUrl?: string;
}

export interface FacilityInput {
  name: string;
  description?: string;
  branchId?: number;
  /**
   * Trạng thái CUỐI CÙNG của thư viện ảnh, không phải "thêm vào": ảnh đang gắn mà
   * vắng mặt sẽ bị BE xoá hẳn. Bỏ trống = không đụng tới ảnh.
   */
  mediaIds?: number[];
}

export interface GymServiceResponse {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  /** Bug S2-05: phụ phí cộng thêm khi khách chọn PT; null/0 = không tính thêm. */
  ptSurcharge?: number;
  durationMinutes?: number;
  categoryId?: number;
  categoryName?: string;
  eligibilityNotes?: string;
  bookingRules?: BookingRules;
  /** UC-027 (B-24): PUBLISHED/HIDDEN/PAUSED/ARCHIVED. */
  status?: CatalogStatus;
  active?: boolean;
}

export interface GymServiceInput {
  name: string;
  description?: string;
  price: number;
  /** Bug S2-05: phụ phí khi khách chọn PT; bỏ trống = không tính thêm. */
  ptSurcharge?: number;
  /** BE @NotNull (B-22). */
  durationMinutes: number;
  categoryId?: number;
  eligibilityNotes?: string;
}

// ── Training packages (UC-025) ──

export interface TrainingPackageResponse {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  /** Bug S2-05: phụ phí cộng thêm khi khách chọn PT; null/0 = không tính thêm. */
  ptSurcharge?: number;
  sessionCount?: number;
  validityDays?: number;
  usageConditions?: string;
  gymServiceId?: number;
  gymServiceName?: string;
  bookingRules?: BookingRules;
  status?: CatalogStatus;
  active?: boolean;
}

export interface TrainingPackageInput {
  name: string;
  description?: string;
  price: number;
  /** Bug S2-05: phụ phí khi khách chọn PT; bỏ trống = không tính thêm. */
  ptSurcharge?: number;
  sessionCount: number;
  validityDays?: number;
  usageConditions?: string;
  gymServiceId?: number;
}

// ── Operating hours + policies (UC-017) ──

export interface OperatingHour {
  /** 1 = Thứ 2 … 7 = Chủ nhật (khớp BE, KHÔNG phải 0-6). */
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  closed?: boolean;
}

export interface GymPolicy {
  id?: number;
  bookingPolicy?: string;
  cancellationPolicy?: string;
  noShowPolicy?: string;
  houseRules?: string;
}

export interface UpdateGymProfileInput {
  gymName?: string;
  description?: string;
  address?: string;
  city?: string;
  /** UC-18: BE ghép address + district + city khi geocode. */
  district?: string;
  phone?: string;
  /**
   * UC-18 (V55): toạ độ trụ sở chọn từ gợi ý địa chỉ. BE chỉ geocode lại khi địa
   * chỉ đổi / thiếu toạ độ, nên gửi lại giá trị cũ cũng không tốn lượt gọi dịch vụ.
   */
  latitude?: number;
  longitude?: number;
  /** Metadata của gợi ý địa chỉ đi kèm toạ độ; bỏ trống thì BE giữ nguyên giá trị đang lưu. */
  placeId?: string;
  /** V65 — dịch vụ đã cấp `placeId`; thiếu nó thì job làm mới toạ độ bỏ qua bản ghi. */
  placeProvider?: PlaceProvider;
  formattedAddress?: string;
  /** UC-18 (V60): toạ độ do chủ gym kéo ghim tay — job làm mới định kỳ sẽ bỏ qua. */
  coordinatesPinned?: boolean;
}

// ── Gym-managed PTs (UC-019..021) ──

export type GymPtStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface GymPtResponse {
  id?: number;
  username?: string;
  email?: string;
  /** Liên hệ của PT (User.phone) — gym sửa được qua UpdateGymPtInput. */
  phone?: string;
  displayName?: string;
  bio?: string;
  specialization?: string;
  serviceArea?: string;
  experienceYears?: number;
  status?: GymPtStatus;
  suspensionReason?: string;
  gymProfileId?: number;
}

export type GymPtPage = PageResponse<GymPtResponse>;

export interface CreateGymPtInput {
  username: string;
  email: string;
  password: string;
  phone?: string;
  displayName: string;
  bio?: string;
  specialization?: string;
  serviceArea?: string;
  experienceYears?: number;
  /** UC-019/022: bắt buộc >= 1 chi nhánh đang hoạt động — BE trả 400 nếu rỗng. */
  branchIds: number[];
}

export interface UpdateGymPtInput {
  displayName?: string;
  bio?: string;
  specialization?: string;
  serviceArea?: string;
  experienceYears?: number;
  phone?: string;
}

export interface PtStatusInput {
  status: GymPtStatus;
}

export interface PtCertInput {
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface PtCertResponse {
  id?: number;
  name?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface PtDocInput {
  documentType: string;
  fileUrl: string;
}

export interface PtDocResponse {
  id?: number;
  documentType?: string;
  fileUrl?: string;
}
