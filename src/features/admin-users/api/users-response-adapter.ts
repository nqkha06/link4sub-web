import type {
  UsersResponse,
  UsersTableData,
} from "@/features/admin-users/types";

export function adaptUsersResponse(
  response: UsersResponse,
): UsersTableData {
  return {
    data: response.data,
    pageCount: response.meta.totalPages,
    total: response.meta.total,
  };
}
