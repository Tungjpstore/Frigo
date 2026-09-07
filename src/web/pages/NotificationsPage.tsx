import React, { useState } from 'react';
import { TopBar } from '../components/common/TopBar';
import { Bell, Calendar, Clock, ShoppingBag, Sparkles, Mail, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';

export const NotificationsPage: React.FC = () => {
  // Notification toggle states matching Screen 7.3:
  const [toggles, setToggles] = useState({
    remindWeekPlan: true,      // Nhắc lập thực đơn tuần
    remindExpiring: true,      // Nhắc nguyên liệu sắp hết
    remindShopping: true,      // Nhắc đi chợ
    remindTodayMeal: true,     // Nhắc bữa ăn hôm nay
    promoUpdates: false,       // Khuyến mãi & cập nhật
    emailNotification: false,  // Email
    pushNotification: true,    // Thông báo trên ứng dụng
  });

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const NOTIFICATION_SETTINGS = [
    {
      key: 'remindWeekPlan' as const,
      label: 'Nhắc lập thực đơn tuần',
      desc: 'Nhắc vào tối Chủ nhật để chuẩn bị đi chợ cho tuần mới',
      icon: Calendar,
    },
    {
      key: 'remindExpiring' as const,
      label: 'Nhắc nguyên liệu sắp hết',
      desc: 'Cảnh báo thực phẩm còn 1-2 ngày hết hạn trong tủ',
      icon: Clock,
    },
    {
      key: 'remindShopping' as const,
      label: 'Nhắc đi chợ',
      desc: 'Gửi danh sách nguyên liệu thiếu vào buổi sáng',
      icon: ShoppingBag,
    },
    {
      key: 'remindTodayMeal' as const,
      label: 'Nhắc bữa ăn hôm nay',
      desc: 'Gợi ý món tối trước giờ tan tầm (17:00)',
      icon: Bell,
    },
    {
      key: 'promoUpdates' as const,
      label: 'Khuyến mãi & cập nhật',
      desc: 'Thông tin tính năng mới và ưu đãi từ Frigo Plus',
      icon: Sparkles,
    },
    {
      key: 'emailNotification' as const,
      label: 'Email',
      desc: 'Gửi thực đơn tuần và hóa đơn dinh dưỡng qua email',
      icon: Mail,
    },
    {
      key: 'pushNotification' as const,
      label: 'Thông báo trên ứng dụng',
      desc: 'Cho phép hiển thị thông báo đẩy (Push notification)',
      icon: Smartphone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-16 max-w-md mx-auto select-none">
      <TopBar showBack title="Thông báo" subtitle="Tùy chỉnh tần suất nhắc nhở" />

      <div className="px-4 pt-4 space-y-3 animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {NOTIFICATION_SETTINGS.map((item) => {
            const isChecked = toggles[item.key];
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 pr-3 min-w-0">
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isChecked ? 'bg-[#DDF7E3] text-[#0F3D2E]' : 'bg-slate-100 text-slate-400'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading font-semibold text-sm text-slate-900 leading-snug truncate">
                      {item.label}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* iOS-style Green Switch */}
                <div
                  className={clsx(
                    'w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 relative flex items-center',
                    isChecked ? 'bg-[#22C55E]' : 'bg-slate-300'
                  )}
                >
                  <div
                    className={clsx(
                      'w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
                      isChecked ? 'translate-x-5.5' : 'translate-x-0'
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
