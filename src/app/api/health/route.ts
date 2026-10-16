/**
 * Liveness của web cho uptime check bên ngoài: chỉ xác nhận tiến trình Next.js
 * còn trả lời. Không gọi API hay database để một phụ thuộc chậm không làm web
 * bị coi là chết; trạng thái phụ thuộc có ở `/api/health/ready` của stu-api.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
