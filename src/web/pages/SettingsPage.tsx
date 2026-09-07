import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/common/TopBar';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/useAuthStore';
import { Globe, Shield, LogOut, Check, Smartphone, Trash2, Info, Wifi } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [language, setLanguage] = useState('vi');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed PWA)
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isPwa);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Để cài đặt Frigo:\n• Trên iPhone/Safari: Nhấn nút "Chia sẻ" (Share) rồi chọn "Thêm vào MH chính" (Add to Home Screen).\n• Trên Android/Chrome: Nhấn menu 3 chấm rồi chọn "Cài đặt ứng dụng".');
    }
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất? Dữ liệu cục bộ sẽ được làm mới.')) {
      logout();
      navigate('/landing');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-12 text-slate-900">
      <TopBar showBack title="Cài đặt" />

      <div className="px-4 pt-3 space-y-4">
        {/* PWA / App Installation */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <h4 className="font-heading font-bold text-sm text-slate-900">Ứng dụng Frigo trên điện thoại</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isStandalone
              ? '✅ Ứng dụng đã được cài đặt và đang chạy ở chế độ Độc lập (Standalone PWA).'
              : 'Cài đặt Frigo lên màn hình chính để mở nhanh không qua trình duyệt và sử dụng ngoại tuyến mọi lúc mọi nơi.'}
          </p>
          {!isStandalone && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallPwa}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-800"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cài đặt lên Màn hình chính (PWA)</span>
            </Button>
          )}
        </Card>

        {/* Offline & Cache Management */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <h4 className="font-heading font-bold text-sm text-slate-900">Dữ liệu Ngoại tuyến & Bộ nhớ đệm</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Frigo lưu trữ thực đơn, tồn kho tủ lạnh và danh sách đi chợ trên thiết bị để bạn xem được ngay cả khi mất sóng trong siêu thị.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{cacheCleared ? '✓ Đã làm mới bộ nhớ đệm' : 'Làm mới bộ nhớ đệm (Clear Cache)'}</span>
          </Button>
        </Card>

        {/* Language */}
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h4 className="font-heading font-bold text-sm text-slate-900">Ngôn ngữ hiển thị (i18n ready)</h4>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[
              { id: 'vi', label: 'Tiếng Việt 🇻🇳' },
              { id: 'en', label: 'English 🇺🇸' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between tap-target transition-all ${
                  language === lang.id
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{lang.label}</span>
                {language === lang.id && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />}
              </button>
            ))}
          </div>
        </Card>

        {/* Privacy Notes */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h4 className="font-heading font-bold text-sm text-slate-900">Quyền riêng tư & AI</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Frigo không gửi email, số điện thoại, vị trí hoặc thông tin cá nhân tới các nhà cung cấp AI. AI chỉ nhận diện nguyên liệu dựa trên hình ảnh thực phẩm ẩn danh của bạn.
          </p>
        </Card>

        {/* App Version Info */}
        <div className="text-center py-2 space-y-1">
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Frigo v1.2.0 • Build 2026.09.05</span>
          </div>
          <p className="text-[11px] text-slate-400">Ăn đủ. Mua đủ. Dùng hết.</p>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <Button
            variant="danger"
            fullWidth
            size="md"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
