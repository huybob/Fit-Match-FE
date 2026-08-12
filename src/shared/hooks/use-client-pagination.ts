"use client";

import { useEffect, useMemo, useState } from "react";

export interface ClientPagination<T> {
  /** Trang hiện tại, đánh số từ 0 — cùng quy ước với Pageable của BE. */
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  /** Lát cắt của trang hiện tại. */
  visible: T[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Phân trang phía client cho danh sách đã nằm sẵn trong bộ nhớ — dùng khi
 * endpoint trả về NGUYÊN mảng (không phân trang) hoặc khi dữ liệu được gộp ở FE.
 *
 * Danh sách nào có endpoint phân trang thật thì gọi thẳng API theo `page`/`size`
 * chứ đừng tải hết rồi cắt ở đây.
 */
export function useClientPagination<T>(items: T[], initialPageSize = 12): ClientPagination<T> {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  /**
   * Danh sách co lại (xoá bản ghi, đổi bộ lọc) mà số trang giữ nguyên thì trang
   * hiện tại có thể vượt quá cuối danh sách — người dùng nhìn thấy màn hình
   * trắng không rõ lý do. Luôn kéo về trang cuối còn dữ liệu.
   */
  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  const visible = useMemo(
    () => items.slice(page * pageSize, page * pageSize + pageSize),
    [items, page, pageSize],
  );

  /** Đổi số mục mỗi trang thì giữ bản ghi đầu trang đang xem trong tầm nhìn. */
  function setPageSize(size: number) {
    const firstIndex = page * pageSize;
    setPageSizeState(size);
    setPage(Math.floor(firstIndex / size));
  }

  return { page, pageSize, totalPages, totalItems, visible, setPage, setPageSize };
}
