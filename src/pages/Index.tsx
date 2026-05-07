import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

/* ─── CONSTANTS ─────────────────────────────────────── */
const VK_URL = 'https://vk.com/thedark32';
const PHONE = '+7 (4812) 00-00-00';
const EMAIL = 'info@thedark.ru';
const ADDRESS = 'г. Брянск, Бежицкий р-н, ул. Союзная, 5';
const MAPS_URL = 'https://yandex.ru/maps/?text=Брянск+Союзная+5';

const QUEST_IMG_1 = 'https://cdn.poehali.dev/projects/3d3ede80-4988-46f4-8af6-d70926a053ee/files/48e4d0e7-25a8-46de-b128-a7cdcd77ee96.jpg';
const QUEST_IMG_2 = 'https://cdn.poehali.dev/projects/3d3ede80-4988-46f4-8af6-d70926a053ee/files/b780f4cd-ad15-468e-b7ea-68d4df850202.jpg';
const HALL_IMG = 'https://cdn.poehali.dev/projects/3d3ede80-4988-46f4-8af6-d70926a053ee/files/c03715cf-6c92-47ef-875a-baf2bc23ead9.jpg';

const TIME_SLOTS = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const HALL_VARIANTS = [
  'Более 3 ч до квеста','3 ч до квеста','2 ч до квеста','1 ч до квеста',
  '1 ч после квеста','2 ч после квеста','3 ч после квеста','Более 3 ч после квеста',
];
const PARTY_TYPES = ['День рождения','Выпускной','Встреча друзей','Корпоратив','Другое'];
const QUEST_TYPES = [
  { id: 'odnoklassnik', name: 'Одноклассник', desc: 'Хоррор-квест', tag: 'Страшно', maxP: 8 },
  { id: 'rashiteli', name: 'Расхитители гробниц', desc: 'Логический квест', tag: 'Логика', maxP: 15 },
];

/* ─── LOCALSTORAGE HELPERS ───────────────────────────── */
type BookingRecord = Record<string, string | number | undefined>;

function getBookings(): BookingRecord[] {
  try { return JSON.parse(localStorage.getItem('tma_bookings') || '[]') as BookingRecord[]; } catch { return []; }
}
function saveBooking(b: BookingRecord) {
  const arr = getBookings();
  arr.push({ ...b, id: Date.now().toString(), createdAt: new Date().toISOString() });
  localStorage.setItem('tma_bookings', JSON.stringify(arr));
}
function isSlotTaken(date: string, startTime: string, type: string, durationHours = 1.5): boolean {
  const bookings = getBookings().filter(b => b.date === date && b.type === type);
  const [sh, sm] = startTime.split(':').map(Number);
  const startMin = sh * 60 + (sm || 0);
  const endMin = startMin + durationHours * 60;
  return bookings.some(b => {
    const [bh, bm] = (b.startTime || '00:00').split(':').map(Number);
    const bs = bh * 60 + (bm || 0);
    const be = bs + (b.durationHours || 1.5) * 60;
    return startMin < be && endMin > bs;
  });
}
function isHallTaken(date: string, startTime: string, durationHours: number): boolean {
  return ['hall','anticinema','karaoke'].some(t => isSlotTaken(date, startTime, t, durationHours));
}

/* ─── CALENDAR ───────────────────────────────────────── */
function Calendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const fmt = (d: number) => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors">
          <Icon name="ChevronLeft" size={16} />
        </button>
        <span className="text-sm font-oswald text-[var(--text-primary)] tracking-wide">{MONTHS_RU[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors">
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_SHORT.map(d => <div key={d} className="text-center text-xs text-[var(--text-muted)] font-oswald py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = fmt(d);
          const isPast = ds < todayStr;
          const isToday = ds === todayStr;
          const isSel = ds === selected;
          let cls = 'cal-day ';
          if (isPast) cls += 'past disabled';
          else if (isSel) cls += 'selected';
          else if (isToday) cls += 'today';
          return <div key={i} className={cls} onClick={() => !isPast && onSelect(ds)}>{d}</div>;
        })}
      </div>
    </div>
  );
}

/* ─── SLOT TABLE ─────────────────────────────────────── */
function SlotTable({ date, selectedSlot, onSelect, type = 'quest', duration = 1.5 }: {
  date: string; selectedSlot: string; onSelect: (s: string) => void; type?: string; duration?: number;
}) {
  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
      {TIME_SLOTS.map(slot => {
        const [h] = slot.split(':').map(Number);
        const isPast = isToday && h <= now.getHours();
        const isTaken = date ? (type === 'hall' || type === 'anticinema' || type === 'karaoke'
          ? isHallTaken(date, slot, duration) : isSlotTaken(date, slot, type, duration)) : false;
        let cls = 'slot-btn ';
        if (isPast) cls += 'past-slot';
        else if (isTaken) cls += 'taken';
        else if (slot === selectedSlot) cls += 'selected';
        return <button key={slot} className={cls} onClick={() => !isPast && !isTaken && onSelect(slot)}>{slot}</button>;
      })}
    </div>
  );
}

/* ─── BOOKING MODAL 7 STEPS ──────────────────────────── */
function BookingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [partyType, setPartyType] = useState('');
  const [persons, setPersons] = useState(6);
  const [age, setAge] = useState(25);
  const [quest, setQuest] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [hallVariant, setHallVariant] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);

  const getHallStart = (variant: string): string => {
    if (!slot) return '';
    const [h] = slot.split(':').map(Number);
    const map: Record<string, number> = {
      'Более 3 ч до квеста': h - 4,'3 ч до квеста': h - 3,'2 ч до квеста': h - 2,'1 ч до квеста': h - 1,
      '1 ч после квеста': h + 2,'2 ч после квеста': h + 3,'3 ч после квеста': h + 4,'Более 3 ч после квеста': h + 5,
    };
    const hh = ((map[variant] ?? h) % 24 + 24) % 24;
    return `${String(hh).padStart(2,'0')}:00`;
  };

  const isHallVariantAvail = (v: string) => {
    if (!date || !slot) return true;
    return !isHallTaken(date, getHallStart(v), 1.5);
  };

  const handleBook = () => {
    saveBooking({ type:'quest', serviceName: QUEST_TYPES.find(q => q.id === quest)?.name, date, startTime:slot, durationHours:1.5, persons, clientName:name, clientPhone:phone, comment, partyType });
    if (hallVariant) saveBooking({ type:'hall', serviceName:'Банкетный зал', date, startTime:getHallStart(hallVariant), durationHours:1.5, persons, clientName:name, clientPhone:phone, hallVariant });
    setSuccess(true);
  };

  const canNext = () => {
    if (step === 1 && !partyType) return false;
    if (step === 3 && !quest) return false;
    if (step === 4 && !date) return false;
    if (step === 5 && !slot) return false;
    return true;
  };

  if (success) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box p-10 text-center animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="text-6xl mb-4">🕯️</div>
        <h2 className="font-cormorant text-4xl text-[var(--accent-red)] mb-3">Бронь принята!</h2>
        <p className="text-[var(--text-muted)] mb-8 font-oswald font-light leading-relaxed">
          Мы свяжемся с вами в ближайшее время<br/>для подтверждения бронирования.
        </p>
        <button className="btn-gothic px-10 py-3" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-dim)]">
          <h3 className="font-cormorant text-lg text-[var(--accent-red)] italic">Подготовим праздник вместе</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors"><Icon name="X" size={18} /></button>
        </div>
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-[var(--border-dim)]">
          {Array.from({length:7},(_,i) => (
            <div key={i} className={`step-dot ${i+1===step?'active':i+1<step?'done':''}`} />
          ))}
          <span className="ml-2 text-xs text-[var(--text-muted)] font-oswald">Шаг {step} из 7</span>
        </div>

        <div className="p-6 min-h-[280px]">
          {/* STEP 1 */}
          {step === 1 && <div className="animate-fade-in space-y-2">
            <h4 className="font-cormorant text-2xl text-white mb-1">Какой повод?</h4>
            <p className="text-xs text-[var(--text-muted)] font-oswald mb-4">Выберите тип мероприятия</p>
            {PARTY_TYPES.map(t => (
              <button key={t} onClick={() => setPartyType(t)}
                className={`w-full text-left px-4 py-3 border transition-all font-oswald text-sm tracking-wide ${
                  partyType===t ? 'border-[var(--accent-red)] bg-[rgba(211,47,47,0.1)] text-white'
                    : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--accent-red)] hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>}

          {/* STEP 2 */}
          {step === 2 && <div className="animate-fade-in">
            <h4 className="font-cormorant text-2xl text-white mb-6">Расскажите о гостях</h4>
            <div className="mb-7">
              <div className="flex justify-between mb-2">
                <label className="text-xs font-oswald text-[var(--text-muted)] uppercase tracking-widest">Кол-во гостей</label>
                <span className="text-[var(--accent-red)] font-cormorant text-3xl leading-none">{persons}</span>
              </div>
              <input type="range" min={1} max={30} value={persons} onChange={e=>setPersons(+e.target.value)} className="gothic-slider" />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 font-oswald"><span>1</span><span>30</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-oswald text-[var(--text-muted)] uppercase tracking-widest">Средний возраст</label>
                <span className="text-[var(--accent-red)] font-cormorant text-3xl leading-none">{age}</span>
              </div>
              <input type="range" min={1} max={100} value={age} onChange={e=>setAge(+e.target.value)} className="gothic-slider" />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 font-oswald"><span>1</span><span>100</span></div>
            </div>
          </div>}

          {/* STEP 3 */}
          {step === 3 && <div className="animate-fade-in space-y-3">
            <h4 className="font-cormorant text-2xl text-white mb-1">Выберите квест</h4>
            <p className="text-xs text-[var(--text-muted)] font-oswald mb-4">{persons>8?'Для вашей группы доступен только «Расхитители» (макс. 15 чел.)':'Оба квеста доступны для вашей группы'}</p>
            {QUEST_TYPES.map(q => {
              const disabled = q.id==='odnoklassnik' && persons>8;
              return (
                <button key={q.id} disabled={disabled} onClick={() => setQuest(q.id)}
                  className={`w-full text-left p-4 border transition-all ${disabled?'opacity-25 cursor-not-allowed border-[var(--border-dim)]':
                    quest===q.id?'border-[var(--accent-red)] bg-[rgba(211,47,47,0.08)]':'border-[var(--border-dim)] hover:border-[var(--accent-red)]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-cormorant text-xl text-white">{q.name}</span>
                    <span className="text-xs px-2 py-0.5 border border-[var(--accent-red)] text-[var(--accent-red)] font-oswald">{q.tag}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-oswald">{q.desc} · 1.5 ч · до {q.maxP} чел.</p>
                </button>
              );
            })}
          </div>}

          {/* STEP 4 */}
          {step === 4 && <div className="animate-fade-in">
            <h4 className="font-cormorant text-2xl text-white mb-4">Выберите дату</h4>
            <Calendar selected={date} onSelect={setDate} />
            {date && <p className="mt-3 text-xs text-[var(--accent-red)] font-oswald tracking-wide">✓ Выбрано: {date}</p>}
          </div>}

          {/* STEP 5 */}
          {step === 5 && <div className="animate-fade-in">
            <h4 className="font-cormorant text-2xl text-white mb-4">Выберите время</h4>
            {date ? <SlotTable date={date} selectedSlot={slot} onSelect={setSlot} type="quest" />
              : <p className="text-sm text-[var(--text-muted)] font-oswald">Сначала выберите дату на шаге 4</p>}
            {slot && <p className="mt-3 text-xs text-[var(--accent-red)] font-oswald">✓ Выбрано: {slot}</p>}
          </div>}

          {/* STEP 6 */}
          {step === 6 && <div className="animate-fade-in">
            <h4 className="font-cormorant text-2xl text-white mb-1">Добавить зал?</h4>
            <p className="text-xs text-[var(--text-muted)] font-oswald mb-4">Банкетный зал, антикинотеатр, караоке — одно помещение. Выберите время относительно квеста.</p>
            <div className="space-y-1.5 mb-4">
              {HALL_VARIANTS.map(v => {
                const avail = isHallVariantAvail(v);
                return (
                  <button key={v} disabled={!avail} onClick={() => setHallVariant(v)}
                    className={`w-full text-left px-4 py-2.5 border transition-all font-oswald text-sm ${
                      !avail?'opacity-25 cursor-not-allowed border-[var(--border-dim)] text-[var(--text-muted)]':
                      hallVariant===v?'border-[var(--accent-red)] bg-[rgba(211,47,47,0.08)] text-white':'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--accent-red)] hover:text-white'}`}>
                    {v}{!avail&&<span className="ml-2 text-xs opacity-60">занято</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setHallVariant(''); setStep(7); }} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors font-oswald underline">
              Пропустить →
            </button>
          </div>}

          {/* STEP 7 */}
          {step === 7 && <div className="animate-fade-in">
            <h4 className="font-cormorant text-2xl text-white mb-4">Ваши данные</h4>
            <div className="bg-[#161616] border border-[var(--border-dim)] p-4 mb-4 text-xs font-oswald">
              <p className="text-[var(--text-muted)] uppercase tracking-widest mb-2">Сводка заказа</p>
              <div className="space-y-1 text-[var(--text-primary)] font-light">
                <p>🎭 {QUEST_TYPES.find(q=>q.id===quest)?.name} · {date} в {slot}</p>
                <p>👥 {persons} чел. · Возраст: {age} лет · {partyType}</p>
                {hallVariant && <p>🏛 Зал: {hallVariant}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <input className="gothic-input" placeholder="Ваше имя *" value={name} onChange={e=>setName(e.target.value)} />
              <input className="gothic-input" type="tel" placeholder="Телефон *" value={phone} onChange={e=>setPhone(e.target.value)} />
              <textarea className="gothic-input resize-none" rows={3} placeholder="Комментарий" value={comment} onChange={e=>setComment(e.target.value)} />
            </div>
          </div>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-dim)]">
          {step > 1
            ? <button onClick={() => setStep(s=>s-1)} className="btn-gothic-outline px-5 py-2 text-xs">← Назад</button>
            : <div />}
          {step < 7
            ? <button disabled={!canNext()} onClick={() => setStep(s=>s+1)} className="btn-gothic px-6 py-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed">Далее →</button>
            : <button disabled={!name||!phone} onClick={handleBook} className="btn-gothic px-6 py-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed">Забронировать 🕯️</button>
          }
        </div>
      </div>
    </div>
  );
}

/* ─── HALL FORM ──────────────────────────────────────── */
function HallForm({ type, title }: { type: string; title: string }) {
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [duration, setDuration] = useState(type === 'mafia' ? 1.5 : 1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const durations = type === 'mafia' ? [1.5, 3] : [1, 3];

  const handleSubmit = () => {
    if (!date || !slot || !name || !phone) return;
    saveBooking({ type, serviceName:title, date, startTime:slot, durationHours:duration, clientName:name, clientPhone:phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
    setDate(''); setSlot(''); setName(''); setPhone('');
  };

  return (
    <div className="bg-[#161616] border border-[var(--border-dim)] p-5 mt-5">
      <p className="text-xs font-oswald uppercase tracking-widest text-[var(--accent-red)] mb-4">Забронировать {title}</p>
      {saved && <div className="bg-[rgba(211,47,47,0.1)] border border-[var(--accent-red)] p-3 mb-4 text-xs font-oswald text-[var(--accent-red)]">✓ Бронь сохранена! Ожидайте звонка.</div>}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[var(--text-muted)] font-oswald uppercase tracking-widest block mb-2">Дата</label>
          <Calendar selected={date} onSelect={setDate} />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] font-oswald uppercase tracking-widest block mb-2">Время</label>
          {date ? <SlotTable date={date} selectedSlot={slot} onSelect={setSlot} type={type} duration={duration} />
            : <p className="text-xs text-[var(--text-muted)] font-oswald">Сначала выберите дату</p>}
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] font-oswald uppercase tracking-widest block mb-2">Длительность</label>
          <div className="flex gap-2">
            {durations.map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className={`px-4 py-2 border text-sm font-oswald transition-all ${duration===d?'border-[var(--accent-red)] bg-[rgba(211,47,47,0.1)] text-white':'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--accent-red)]'}`}>
                {d} ч
              </button>
            ))}
          </div>
        </div>
        <input className="gothic-input" placeholder="Имя *" value={name} onChange={e=>setName(e.target.value)} />
        <input className="gothic-input" type="tel" placeholder="Телефон *" value={phone} onChange={e=>setPhone(e.target.value)} />
        <button onClick={handleSubmit} disabled={!date||!slot||!name||!phone}
          className="btn-gothic w-full py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
          Забронировать
        </button>
      </div>
    </div>
  );
}

/* ─── AI CHAT ────────────────────────────────────────── */
const AI_KB = [
  { q:['цена','стоимость','сколько','прайс'], a:'Квесты от 7 000 ₽ (6 чел., будни). Мафия от 4 000 ₽/1.5 ч. Антикинотеатр/зал от 1 000 ₽/ч. Караоке от 1 500 ₽/ч.' },
  { q:['одноклассник'], a:'Хоррор-квест «Одноклассник» — до 8 чел., 1.5 ч. Будни: 7 000 ₽ (6 чел.), вых.: 8 000 ₽. +500 ₽ за каждого свыше 6.' },
  { q:['расхитители','гробниц'], a:'Логический квест «Расхитители гробниц» — до 15 чел., 1.5 ч. Будни: 7 000 ₽ (6 чел.), вых.: 8 000 ₽. +500 ₽ за каждого свыше 6.' },
  { q:['квест'], a:'Есть два квеста: «Одноклассник» (хоррор, до 8 чел.) и «Расхитители гробниц» (логика, до 15 чел.). Оба по 1.5 ч, от 7 000 ₽.' },
  { q:['мафия'], a:'Мафия: будни — 1.5 ч/4 000 ₽, 3 ч/7 000 ₽. Вых. — 1.5 ч/5 000 ₽, 3 ч/9 000 ₽. Отдельный зал.' },
  { q:['зал','банкет'], a:'Банкетный зал (PS5 + чайник): будни — 1 ч/1 000 ₽, 3 ч/2 400 ₽. Вых. — 1 ч/1 500 ₽, 3 ч/3 000 ₽.' },
  { q:['антикинотеатр','кино','ps'], a:'Антикинотеатр (PS5 + чайник): будни — 1 ч/1 000 ₽, 3 ч/2 400 ₽. Вых. — 1 ч/1 500 ₽, 3 ч/3 000 ₽.' },
  { q:['караоке'], a:'Смарт-Караоке — скоро! Следите за обновлениями в ВКонтакте: vk.com/thedark32' },
  { q:['слот','время','бронь','записаться','запись'], a:'Слоты каждые 2 часа с 00:00 до 22:00. Нажмите «Давай подготовим праздник вместе!» для выбора удобного времени.' },
  { q:['скоро','ноябрь','новый квест'], a:'В ноябре откроется третий квест! Подробности в ВКонтакте: vk.com/thedark32' },
  { q:['адрес','где','находится','приехать','проехать','район','бежицк','союзная','локация','место'], a:'Мы в Брянске: Бежицкий район, ул. Союзная, 5. Удобно добраться на машине и общественном транспорте.' },
  { q:['брянск','город'], a:'Да, мы находимся в Брянске — Бежицкий район, ул. Союзная, 5.' },
];

function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{r:'u'|'a', t:string}[]>([
    { r:'a', t:'Добро пожаловать в ТЬМУ 🕯️ Спросите о ценах, квестах, слотах или бронировании.' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    setMsgs(p => [...p, {r:'u', t:q}]);
    const lower = q.toLowerCase();
    const match = AI_KB.find(k => k.q.some(w => lower.includes(w)));
    const reply = match ? match.a : `Для точного ответа свяжитесь с нами в ВК: vk.com/thedark32 или по тел. ${PHONE}`;
    setTimeout(() => setMsgs(p => [...p, {r:'a', t:reply}]), 600);
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-window animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-dim)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-red)] animate-pulse" />
              <span className="font-oswald text-sm text-white tracking-wide">ИИ-Консультант</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-white transition-colors"><Icon name="X" size={15} /></button>
          </div>
          <div className="overflow-y-auto p-3 space-y-2.5" style={{maxHeight:260}}>
            {msgs.map((m,i) => (
              <div key={i} className={`flex ${m.r==='u'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[88%] px-3 py-2 text-xs font-oswald font-light leading-relaxed ${
                  m.r==='u' ? 'bg-[var(--accent-red)] text-white' : 'bg-[#222] border border-[var(--border-dim)] text-[var(--text-primary)]'}`}>
                  {m.t}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex border-t border-[var(--border-dim)]">
            <input
              className="flex-1 bg-transparent px-3 py-2.5 text-xs font-oswald outline-none text-white placeholder:text-[var(--text-muted)]"
              placeholder="Спросите что-нибудь..."
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&send()}
            />
            <button onClick={send} className="px-3 text-[var(--accent-red)] hover:text-white transition-colors">
              <Icon name="Send" size={15} />
            </button>
          </div>
        </div>
      )}
      <button className="chat-bubble" onClick={() => setOpen(o=>!o)}>
        <Icon name="MessageCircle" size={22} color="white" />
      </button>
    </div>
  );
}

/* ─── SERVICE PAGE ───────────────────────────────────── */
interface ServiceDef {
  id: string; name: string; tag: string; img: string | null; type: string; soon: boolean;
  desc: string; prices: string[]; form: boolean; formType?: string;
}
function ServicePage({ service, onClose, onBook }: { service:ServiceDef; onClose:()=>void; onBook:()=>void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-2xl w-full animate-scale-in" style={{maxHeight:'92vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          {service.img
            ? <img src={service.img} alt={service.name} className="w-full h-full object-cover opacity-60" />
            : <div className="w-full h-full bg-[#111] flex items-center justify-center"><Icon name="Star" size={40} color="var(--border-dim)" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[rgba(0,0,0,0.4)] to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-[var(--accent-red)] transition-colors bg-[rgba(0,0,0,0.5)] p-1.5">
            <Icon name="X" size={18} />
          </button>
          <div className="absolute bottom-4 left-6">
            <p className="text-xs font-oswald text-[var(--accent-red)] tracking-widest uppercase mb-1">{service.tag}</p>
            <h2 className="font-cormorant text-3xl text-white">{service.name}</h2>
          </div>
        </div>
        <div className="p-6">
          {!service.soon && <>
            <button onClick={onBook} className="btn-gothic w-full py-3 text-sm mb-5">
              Давай подготовим праздник вместе!
            </button>
            <p className="font-oswald font-light text-[var(--text-muted)] text-sm leading-relaxed mb-5">{service.desc}</p>
            <div className="border border-[var(--border-dim)] p-4 mb-2">
              <p className="text-xs font-oswald uppercase tracking-widest text-[var(--accent-red)] mb-3">Цены</p>
              {service.prices?.map((p:string,i:number) => (
                <p key={i} className="text-sm font-oswald font-light text-[var(--text-primary)] py-2 border-b border-[var(--border-dim)] last:border-0">{p}</p>
              ))}
            </div>
            {service.form && <HallForm type={service.formType} title={service.name} />}
            <button onClick={onBook} className="btn-gothic w-full py-3 text-sm mt-5">
              Давай подготовим праздник вместе!
            </button>
          </>}
          {service.soon && (
            <div className="text-center py-8">
              <p className="font-cormorant text-3xl text-[var(--text-muted)] mb-3">Скоро...</p>
              <p className="font-oswald text-sm text-[var(--text-muted)] mb-5">Следите за обновлениями</p>
              <a href={VK_URL} target="_blank" rel="noopener noreferrer" className="btn-gothic px-8 py-3 inline-block">
                ВКонтакте
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────── */
const SERVICES = [
  { id:'odnoklassnik', name:'Одноклассник', tag:'Хоррор', img:QUEST_IMG_1, type:'quest', soon:false,
    desc:'Старый класс хранит страшные секреты. Хватит ли духа разгадать их и вырваться до рассвета?',
    prices:['До 6 чел.: 7 000 ₽ (будни) / 8 000 ₽ (вых.)','Доп. человек: +500 ₽','Максимум: 8 человек','Продолжительность: 1.5 часа'],
    form:false },
  { id:'rashiteli', name:'Расхитители гробниц', tag:'Логика', img:QUEST_IMG_2, type:'quest', soon:false,
    desc:'Древняя гробница скрывает тысячелетние загадки. Разгадайте иероглифы и завладейте артефактом.',
    prices:['До 6 чел.: 7 000 ₽ (будни) / 8 000 ₽ (вых.)','Доп. человек: +500 ₽','Максимум: 15 человек','Продолжительность: 1.5 часа'],
    form:false },
  { id:'unknown', name:'Неизвестно', tag:'Скоро · Ноябрь', img:null, type:'quest', soon:true, desc:'', prices:[], form:false },
  { id:'mafia', name:'Мафия', tag:'Психологическая игра', img:HALL_IMG, type:'mafia', soon:false,
    desc:'Кто мирный житель, а кто скрывает тёмную тайну? Ролевая игра на хитрость, интуицию и красноречие.',
    prices:['Будни: 1.5 ч / 4 000 ₽, 3 ч / 7 000 ₽','Выходные: 1.5 ч / 5 000 ₽, 3 ч / 9 000 ₽'],
    form:true, formType:'mafia' },
  { id:'anticinema', name:'Антикинотеатр', tag:'PS5 · Кино', img:HALL_IMG, type:'hall', soon:false,
    desc:'Уютное пространство с большим экраном, PS5 и чайником. Ваш личный кинозал.',
    prices:['Будни: 1 ч / 1 000 ₽, 3 ч / 2 400 ₽','Выходные: 1 ч / 1 500 ₽, 3 ч / 3 000 ₽'],
    form:true, formType:'anticinema' },
  { id:'hall', name:'Банкетный зал', tag:'PS5 · Праздник', img:HALL_IMG, type:'hall', soon:false,
    desc:'Просторный зал для вашего праздника. Идеально для дней рождения, корпоративов и встреч.',
    prices:['Будни: 1 ч / 1 000 ₽, 3 ч / 2 400 ₽','Выходные: 1 ч / 1 500 ₽, 3 ч / 3 000 ₽'],
    form:true, formType:'hall' },
  { id:'karaoke', name:'Смарт-Караоке', tag:'Скоро', img:null, type:'karaoke', soon:true, desc:'', prices:[], form:false },
];

export default function Index() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState<ServiceDef | null>(null);

  const quests = SERVICES.filter(s => s.type === 'quest');
  const rest = SERVICES.filter(s => s.type !== 'quest');

  const openBooking = () => setBookingOpen(true);

  return (
    <div className="min-h-screen" style={{background:'var(--dark-bg)', color:'var(--text-primary)'}}>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f1f1f] bg-[rgba(10,10,10,0.96)] backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[var(--accent-red)] flex items-center justify-center">
              <span className="text-[var(--accent-red)] text-xs font-oswald font-bold">Т</span>
            </div>
            <span className="font-cormorant text-xl tracking-[0.2em] animate-flicker">ТЬМА</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {[['квесты','#квесты'],['мафия','#мафия'],['залы','#залы'],['контакты','#контакты']].map(([l, h]) => (
              <a key={l} href={h} className="text-xs font-oswald text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors uppercase tracking-widest">{l}</a>
            ))}
          </nav>
          <button onClick={openBooking} className="btn-gothic px-4 py-2 text-xs hidden sm:block">Забронировать</button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{background:'radial-gradient(circle, rgba(211,47,47,0.06) 0%, transparent 70%)'}} />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-oswald tracking-[0.5em] text-[var(--accent-red)] uppercase mb-5 animate-fade-in-up">Брянск · Квест-клуб</p>
          <h1 className="font-cormorant text-8xl sm:text-9xl font-light leading-none mb-3 animate-fade-in-up delay-100 text-glow" style={{opacity:0}}>
            ТЬМА
          </h1>
          <div className="gothic-divider max-w-xs mx-auto my-5 animate-fade-in delay-200" style={{opacity:0}}>
            <span className="text-xs font-oswald tracking-widest text-[var(--accent-red)]">⁕</span>
          </div>
          <p className="font-cormorant italic text-2xl text-[var(--text-muted)] mb-8 max-w-md mx-auto animate-fade-in-up delay-300" style={{opacity:0}}>
            Место, где рождаются незабываемые праздники
          </p>
          <button onClick={openBooking} className="btn-gothic px-10 py-4 text-sm animate-pulse-red animate-fade-in-up delay-400" style={{opacity:0}}>
            Давай подготовим праздник вместе!
          </button>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float text-[var(--text-muted)]">
          <Icon name="ChevronDown" size={22} />
        </div>
      </section>

      {/* QUESTS */}
      <section id="квесты" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-oswald tracking-[0.5em] text-[var(--accent-red)] uppercase mb-3">Испытайте страх</p>
          <h2 className="font-cormorant text-6xl text-white">Квесты</h2>
          <div className="gothic-divider max-w-xs mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quests.map((s) => (
            <div key={s.id} className="service-card" onClick={() => setServiceOpen(s)}>
              <div className="relative h-72 overflow-hidden">
                {s.img
                  ? <img src={s.img} alt={s.name} className="card-image w-full h-full object-cover" />
                  : <div className="w-full h-full bg-[#0f0f0f] flex flex-col items-center justify-center gap-3 border border-dashed border-[#2a2a2a]">
                      <span className="font-cormorant text-6xl text-[#333]">?</span>
                      <p className="font-oswald text-xs text-[var(--text-muted)] tracking-widest">В ноябре</p>
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                <div className="card-overlay">
                  {s.soon
                    ? <a href={VK_URL} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="btn-gothic-outline px-6 py-2.5 text-xs">Скоро в VK</a>
                    : <button className="btn-gothic px-6 py-2.5 text-xs">Записаться</button>
                  }
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-oswald text-[var(--accent-red)] tracking-widest uppercase mb-1">{s.tag}</p>
                <h3 className="font-cormorant text-2xl text-white">{s.name}</h3>
                {!s.soon && <p className="text-xs text-[var(--text-muted)] font-oswald mt-1.5">от 7 000 ₽ · 1.5 ч</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MID CTA */}
      <div className="py-12 border-y border-[var(--border-dim)] bg-[rgba(211,47,47,0.03)]">
        <div className="container mx-auto px-4 text-center">
          <p className="font-cormorant italic text-xl text-[var(--text-muted)] mb-4">Не знаете с чего начать?</p>
          <button onClick={openBooking} className="btn-gothic px-10 py-4 text-sm">
            Давай подготовим праздник вместе!
          </button>
        </div>
      </div>

      {/* REST SERVICES */}
      <section id="мафия" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-oswald tracking-[0.5em] text-[var(--accent-red)] uppercase mb-3">Больше форматов</p>
          <h2 className="font-cormorant text-6xl text-white">Развлечения</h2>
          <div className="gothic-divider max-w-xs mx-auto mt-4" />
        </div>
        <div id="залы" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {rest.map((s) => (
            <div key={s.id} className="service-card" onClick={() => setServiceOpen(s)}>
              <div className="relative h-52 overflow-hidden">
                {s.img
                  ? <img src={s.img} alt={s.name} className="card-image w-full h-full object-cover opacity-75" />
                  : <div className="w-full h-full bg-[#0f0f0f] flex items-center justify-center border border-dashed border-[#2a2a2a]">
                      <Icon name="Music" size={36} color="#2a2a2a" />
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                <div className="card-overlay">
                  {s.soon
                    ? <a href={VK_URL} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="btn-gothic-outline px-5 py-2 text-xs">Скоро</a>
                    : <button className="btn-gothic px-5 py-2 text-xs">Подробнее</button>
                  }
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-oswald text-[var(--accent-red)] tracking-widest uppercase mb-1">{s.tag}</p>
                <h3 className="font-cormorant text-xl text-white">{s.name}</h3>
                {!s.soon && <p className="text-xs text-[var(--text-muted)] font-oswald mt-1">от 1 000 ₽/ч</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 border-t border-[var(--border-dim)]">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-oswald tracking-[0.5em] text-[var(--accent-red)] uppercase mb-3">О нас</p>
            <h2 className="font-cormorant text-5xl text-white mb-4">Мы создаём атмосферу</h2>
            <div className="gothic-divider mb-5 max-w-xs" />
            <p className="font-oswald font-light text-[var(--text-muted)] text-sm leading-relaxed mb-3">
              ТЬМА — это не просто квест-клуб. Это место, где каждое событие превращается в легенду. Продуманная атмосфера, живые эмоции и незабываемые впечатления.
            </p>
            <p className="font-oswald font-light text-[var(--text-muted)] text-sm leading-relaxed">
              День рождения, корпоратив, выпускной или вечер с друзьями — мы подберём идеальный формат для любого повода.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{i:'Users',v:'1000+',l:'Гостей'},{i:'Star',v:'4.9',l:'Рейтинг'},{i:'Clock',v:'2',l:'Квеста'},{i:'Trophy',v:'5',l:'Форматов'}].map((s,idx)=>(
              <div key={idx} className="bg-[var(--dark-card)] border border-[var(--border-dim)] p-5 text-center hover:border-[var(--accent-red)] transition-colors">
                <Icon name={s.i} size={22} color="var(--accent-red)" />
                <p className="font-cormorant text-4xl text-white mt-2">{s.v}</p>
                <p className="text-xs font-oswald text-[var(--text-muted)] tracking-widest uppercase mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="контакты" className="border-t border-[var(--border-dim)] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border border-[var(--accent-red)] flex items-center justify-center">
                  <span className="text-[var(--accent-red)] text-xs font-oswald font-bold">Т</span>
                </div>
                <span className="font-cormorant text-xl tracking-[0.2em]">ТЬМА</span>
              </div>
              <p className="font-oswald font-light text-[var(--text-muted)] text-xs leading-relaxed">
                Квест-клуб в Брянске. Квесты, мафия, антикинотеатр, банкетный зал, смарт-караоке.
              </p>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 mt-3 text-xs font-oswald font-light text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors">
                <Icon name="MapPin" size={12} /> {ADDRESS}
              </a>
            </div>
            <div>
              <p className="text-xs font-oswald uppercase tracking-widest text-[var(--accent-red)] mb-4">Контакты</p>
              <div className="space-y-2">
                <a href={`tel:${PHONE}`} className="flex items-center gap-2 text-xs font-oswald font-light text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors">
                  <Icon name="Phone" size={13} /> {PHONE}
                </a>
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-xs font-oswald font-light text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors">
                  <Icon name="Mail" size={13} /> {EMAIL}
                </a>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-oswald font-light text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors">
                  <Icon name="MapPin" size={13} /> {ADDRESS}
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-oswald uppercase tracking-widest text-[var(--accent-red)] mb-4">Социальные сети</p>
              <a href={VK_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border-dim)] text-xs font-oswald text-[var(--text-muted)] hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-all">
                <Icon name="ExternalLink" size={13} /> ВКонтакте
              </a>
            </div>
          </div>
          <div className="gothic-divider mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-oswald text-[var(--text-muted)]">© 2024 ТЬМА · Квест-клуб Брянск</p>
            <button onClick={openBooking} className="btn-gothic px-6 py-2.5 text-xs">
              Давай подготовим праздник вместе!
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
      {serviceOpen && (
        <ServicePage service={serviceOpen} onClose={() => setServiceOpen(null)} onBook={() => { setServiceOpen(null); setBookingOpen(true); }} />
      )}

      {/* AI CHAT */}
      <AIChat />
    </div>
  );
}