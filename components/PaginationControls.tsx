import Link from "next/link";

import { Button } from "./ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  sectionId: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  sectionId,
}: PaginationControlsProps) {
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    return queryString ? `/?${queryString}#${sectionId}` : `/#${sectionId}`;
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show current page with 2 pages on each side
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      {/* Previous Button */}
      <Link href={getPageUrl(currentPage - 1)}>
        <Button variant="outline" size="sm" className="px-3 py-1" disabled={currentPage === 1}>
          Previous
        </Button>
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page) => (
          <Link key={page} href={getPageUrl(page)}>
            <Button
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              className={`min-w-[40px] px-3 py-1 ${
                page === currentPage
                  ? "bg-primary-200 text-white"
                  : "hover:bg-primary-50 bg-white text-primary-100"
              }`}
            >
              {page}
            </Button>
          </Link>
        ))}
      </div>

      {/* Next Button */}
      <Link href={getPageUrl(currentPage + 1)}>
        <Button
          variant="outline"
          size="sm"
          className="px-3 py-1"
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </Link>

      <span className="ml-4 text-sm text-light-400">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
