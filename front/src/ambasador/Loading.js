import React from "react";

function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col items-center">
                {/* Spinner */}
                <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                {/* Matn */}
                <p className="mt-4 text-white font-medium text-lg">Yuklanmoqda...</p>
            </div>
        </div>
    );
}

export default Loading;
