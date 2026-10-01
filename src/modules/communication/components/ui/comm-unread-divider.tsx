"use client";

export function CommUnreadDivider() {
  return (
    <div className="relative py-3">
      <div className="absolute inset-0 flex items-center px-4">
        <div className="border-primary/30 w-full border-t" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#1a73e8] px-2.5 py-0.5 text-xs font-medium text-white rounded-full">New messages</span>
      </div>
    </div>
  );
}
