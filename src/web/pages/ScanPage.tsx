import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScanStore } from '../stores/useScanStore';
import { api } from '../services/api';
import { FRIGO_ASSETS } from '../lib/frigo-assets';
import { CameraViewfinder } from '../components/scan/CameraViewfinder';
import { ArrowLeft, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    imagePreviewUrl,
    isProcessing,
    statusText,
    setImage,
    setScanType,
    setProcessing,
    setScanResults,
    reset,
  } = useScanStore();

  const [activeTab, setActiveTab] = useState<'fridge' | 'food' | 'receipt'>('fridge');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tabs = [
    { id: 'fridge' as const, label: 'Tủ lạnh' },
    { id: 'food' as const, label: 'Thực phẩm' },
    { id: 'receipt' as const, label: 'Hóa đơn' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const preview = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImage(preview, base64);
      await startAIScan(base64);
    };
    reader.readAsDataURL(file);
  };

  const startAIScan = async (base64: string) => {
    setErrorMsg(null);
    if (activeTab === 'receipt') {
      setProcessing(true, 'Đang quét hóa đơn mua sắm...');
      try {
        setTimeout(() => setProcessing(true, 'AI Vision đang nhận diện tên hàng & đơn giá...'), 600);
        setTimeout(() => setProcessing(true, 'Bóc tách mặt hàng và kiểm tra đối chiếu...'), 1200);

        const receiptRes = await api.scanReceipt(base64);

        setTimeout(() => {
          setProcessing(false);
          navigate(`/scan/receipt-review?scanId=${encodeURIComponent(receiptRes.id)}`, {
            state: { receipt: receiptRes },
          });
        }, 1600);
      } catch {
        setErrorMsg('Không thể bóc tách hóa đơn. Vui lòng thử lại với ảnh rõ nét hơn!');
        setProcessing(false);
      }
      return;
    }

    setProcessing(true, 'Đang tải ảnh lên...');
    try {
      setTimeout(() => setProcessing(true, 'AI Vision đang nhận diện nguyên liệu...'), 600);
      setTimeout(() => setProcessing(true, 'Chuẩn hóa định lượng & kiểm tra độ tươi...'), 1200);

      const scanRes = await api.scanFridge(base64, activeTab);

      setTimeout(() => {
        setScanResults(scanRes.id, scanRes.items);
        navigate(`/scan/${scanRes.id}/review`);
      }, 1600);
    } catch {
      setErrorMsg('Không thể xử lý ảnh hoặc nhận diện thất bại. Vui lòng thử lại!');
      setProcessing(false);
    }
  };

  const handleUseMockImage = async () => {
    reset();
    setImage(FRIGO_ASSETS.illustrations['scan-fridge']);
    await startAIScan('mock-fridge-base64');
  };

  return (
    <div className="min-h-screen bg-[#0F3D2E] text-white flex flex-col justify-between p-4 relative overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10 pt-2">
        <button
          onClick={() => {
            reset();
            navigate('/');
          }}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center tap-target transition-all"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Tab Pills */}
        <div className="flex bg-slate-900/50 rounded-xl p-1 backdrop-blur-md border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setScanType(tab.id);
              }}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all relative tap-target',
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-10" />
      </div>

      {/* Viewfinder Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-2 z-10 w-full max-w-sm mx-auto">
        <div className="relative w-full">
          {imagePreviewUrl ? (
            <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-white/20 bg-black/40 shadow-2xl flex items-center justify-center">
              <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <CameraViewfinder
              scanType={activeTab}
              onCapture={(base64) => {
                setImage(base64, base64);
                startAIScan(base64);
              }}
              onSelectFromGallery={() => fileInputRef.current?.click()}
            />
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 rounded-2xl animate-in fade-in duration-300">
              <div className="relative mb-4">
                <div className="animate-spin w-14 h-14 border-2 border-emerald-500 border-t-transparent rounded-full" />
                <Sparkles className="w-6 h-6 text-emerald-300 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h4 className="font-heading font-bold text-base text-white">{statusText}</h4>
              <p className="text-xs text-slate-300 mt-1">Đang phân tích cấu trúc nguyên liệu...</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 bg-rose-500/20 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-100 flex items-center gap-2 max-w-sm w-full">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Hidden File Input for fallback gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Bottom Mock Trigger fallback */}
      <div className="z-10 pb-4 text-center">
        <button
          onClick={handleUseMockImage}
          disabled={isProcessing}
          className="text-xs text-slate-300 hover:text-white underline underline-offset-4 flex items-center justify-center gap-1.5 mx-auto tap-target transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử quét ảnh mẫu {activeTab === 'receipt' ? 'hóa đơn WinMart' : 'tủ lạnh'}</span>
        </button>
      </div>
    </div>
  );
};
