export function getUserId(request) {
  return request.headers.get("x-user-id") || "local-user";
}
