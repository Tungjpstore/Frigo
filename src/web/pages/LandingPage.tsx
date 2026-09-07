import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/common/Button';
import { FRIGO_ASSETS } from '../lib/frigo-assets';
import { Camera, ChefHat, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const setGuestSession = useAuthStore((s) => s.setGuestSession);

  const handleStartGuest = async () => {
    await setGuestSession();
    navigate('/onboarding');
  };

  const handleQuickScan = async () => {
    await setGuestSession();
    navigate('/scan');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between px-6 py-10 relative overflow-hidden select-none max-w-md mx-auto">
      {/* Brand Header */}
      <div className="relative z-10 text-center pt-4">
        <div className="flex justify-center mb-3">
          <img
            src={FRIGO_ASSETS.brand.logoPrimary}
            alt="Frigo Logo"
            className="h-12 w-auto object-contain"
          />
        </div>
        <p className="font-heading font-bold text-xl text-slate-900 mb-1">
          Mở tủ lạnh. Biết ngay hôm nay ăn gì.
        </p>
        <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
          Quản lý thực phẩm thông minh, giảm lãng phí và gợi ý món ngon chuẩn xác cùng AI.
        </p>
      </div>

      {/* Hero Illustration */}
      <div className="relative z-10 my-6">
        <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-white p-6 text-center">
          <div className="w-44 h-44 mx-auto mb-3 overflow-hidden flex items-center justify-center">
            <img
              src={FRIGO_ASSETS.illustrations['scan-fridge']}
              alt="Scan Fridge"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900">
            Nhận diện nguyên liệu tức thì
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Chỉ cần 1 bức ảnh chụp tủ lạnh, Frigo sẽ phân loại và tính toán món ăn tối ưu ngay cho bạn.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 space-y-3">
        <Button
          fullWidth
          size="lg"
          onClick={handleQuickScan}
          className="flex items-center justify-center gap-2 text-base"
        >
          <Camera className="w-5 h-5" />
          <span>Chụp thử tủ lạnh ngay</span>
        </Button>

        <Button
          fullWidth
          size="md"
          variant="secondary"
          onClick={handleStartGuest}
          className="flex items-center justify-center gap-2"
        >
          <ChefHat className="w-5 h-5 text-emerald-700" />
          <span>Bắt đầu trải nghiệm (Khách)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/auth')}
            className="text-xs text-slate-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
          >
            Đã có tài khoản? Đăng nhập tại đây
          </button>
        </div>
      </div>
    </div>
  );
};
