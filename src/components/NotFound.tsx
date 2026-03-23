import React from "react";

export default function NotFound() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center px-6">
      <div className="flex items-center gap-12 max-w-5xl w-full">

        {/* КОТ */}
        <div className="flex-shrink-0">
          <img
            src="/notfound.png"
            alt="Not Found"
            className="h-[260px] w-auto object-contain select-none pointer-events-none"
          />
        </div>

        {/* ТЕКСТ */}
        <div className="flex flex-col justify-center h-[260px]">
          <div className="text-7xl font-bold text-white leading-none">
            404
          </div>

          <div className="mt-4 text-white/60 text-lg max-w-md">
            Такой страницы не существует или адрес введён неправильно.
            Проверь адрес и попробуй снова.
          </div>
        </div>

      </div>
    </div>
  );
}