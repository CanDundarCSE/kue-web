// Notice-and-takedown affordance for user-generated reviews. Law 5651 only
// makes a hosting provider liable for third-party content after it has been
// notified and failed to act, so every public review carries a one-click way
// to report it.
export default function ReviewReportLink({
  reviewId,
  mediaId,
  className,
}: {
  reviewId: number;
  mediaId: number;
  className?: string;
}) {
  const subject = encodeURIComponent(
    `Report review #${reviewId} on Kue`,
  );
  const body = encodeURIComponent(
    [
      `Review: #${reviewId}`,
      `Page: /media/${mediaId}/reviews`,
      "",
      "Why is this content unlawful or against the Terms of Service?",
      "",
      "",
    ].join("\n"),
  );

  return (
    <a
      href={`mailto:candundarcse@gmail.com?subject=${subject}&body=${body}`}
      className={className}
    >
      Report
    </a>
  );
}
