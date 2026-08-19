# E2E — Mua vé & Đặt lịch (mô hình "Gym xếp ca — PT xin nghỉ")

Bộ test lái GIAO DIỆN THẬT bằng Playwright, kết hợp gọi API để assert và can
thiệp DB cho những thứ nghiệp vụ không tạo ra được trong lúc chạy.

## Chạy

Ba cửa sổ terminal, theo thứ tự:

```bash
# 1. Backend cho test — schema RIÊNG, cổng RIÊNG, không đụng dev
cd Fit-Match-BE
DB_URL="jdbc:mariadb://localhost:3306/fitmatch_e2e?createDatabaseIfNotExist=true" \
DB_USERNAME=root DB_PASSWORD=123456 \
SPRING_PROFILES_ACTIVE=local \
CASSO_WEBHOOK_SECRET=e2e-webhook-secret \
java -jar target/fitmatch-0.0.1-SNAPSHOT.jar --server.port=8090 \
  --app.ticket.session-completion-cron="0 * * * * *"

# 2. Frontend trỏ vào backend test
cd Fit-Match-FE
NEXT_PUBLIC_API_BASE_URL=http://localhost:8090/api npm run dev -- -p 3100

# 3. Chạy test
cd Fit-Match-FE
npm run e2e             # toàn bộ
npm run e2e -- a-purchase   # một nhóm
npm run e2e:headed      # xem trình duyệt thao tác
```

Schema `fitmatch_e2e` được Flyway tạo từ đầu (V1 → V91). Muốn chạy lại từ trạng
thái sạch thì `drop database fitmatch_e2e` rồi khởi động lại backend.

## Vì sao cron bị rút ngắn

`--app.ticket.session-completion-cron="0 * * * * *"` cho job nền chạy mỗi phút
thay vì 00:10 hằng đêm. Nhóm D cần nó để kiểm "khách quên quyết → hệ thống tự
hoàn phụ phí HLV" mà không phải chờ tới hôm sau.

## Quy tắc dùng SQL

`fixtures/db.ts` chỉ mở đúng ba loại can thiệp: lùi ngày buổi tập, ép đơn thanh
toán quá hạn, ép trạng thái escrow của vé. **Không** tạo vé / buổi tập / ca bằng
SQL — dữ liệu không đi qua code nghiệp vụ thì test xanh cũng không chứng minh
được gì.

## Vì sao thanh toán đi qua webhook Casso

Backend không có endpoint mô phỏng thanh toán (`HealthService
.isPaymentSimulatorEnabled()` trả `false` cứng, dù FE còn cờ
`NEXT_PUBLIC_DEV_PAYMENT`). Cách duy nhất để một vé sang `ACTIVE` +
`settlement_status = HELD` qua code thật là bắn webhook đã ký —
xem `fixtures/casso.ts`.

## Thứ tự spec

Các spec dùng chung một môi trường CÓ TRẠNG THÁI và phụ thuộc nhau theo thứ tự
chữ cái (`playwright.config.ts` đặt `workers: 1`, `fullyParallel: false`):

| Spec | Nội dung |
|---|---|
| `a0-setup` | Dữ liệu nền qua UI: duyệt gym, chi nhánh, giờ mở cửa, ca, PT, xếp ca, loại vé |
| `a-purchase` | Mua vé, thanh toán đúng/thiếu/trùng/quá hạn, vé giảm 100% |
| `b-schedule` | Đặt lịch với PT trên lưới ca, slot lệch lưới, đặt trùng, dời ngày |
| `c-pt-leave` | PT xin nghỉ → Gym duyệt → khách đổi PT hoặc nhận hoàn tiền, bất biến tiền |
| `d-jobs` | Job nền: tự hoàn khi khách quên quyết, thứ tự job, buổi DONE không bị đụng |
| `e-race` | Hai khách cùng slot; duyệt đơn nghỉ trùng lúc khách đặt |
