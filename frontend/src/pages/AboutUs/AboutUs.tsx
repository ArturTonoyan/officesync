import Header from "../../modules/Header/Header";
import brain from "@assets/images/icons/brain.svg";
import tehno from "@assets/images/icons/tehno.svg";
import user from "@assets/images/icons/user.svg";
import men from "@assets/images/aboutUs/men.png";
import chemodan from "@assets/images/icons/chemodan.svg";
import monitor from "@assets/images/icons/monitor.svg";
import arrows from "@assets/images/icons/arrows.svg";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@store/hooks";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";

const iconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-muted [&_img]:h-5 [&_img]:w-5";

function AboutUs() {
  const navigate = useNavigate();
  const userEmail = useAppSelector((state) => state.user.user.data?.email);
  const isAdmin = useAppSelector((state) =>
    state.user.user.data?.roles?.some((role) => role.value === "ADMIN"),
  );

  const handleCta = () => {
    if (isAdmin) navigate("/admin");
    else if (userEmail) navigate("/profile");
    else navigate("/authorization");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-20">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-bg bg-[radial-gradient(ellipse_80%_50%_at_15%_-10%,rgba(232,246,238,0.7),transparent_55%),radial-gradient(ellipse_70%_45%_at_90%_5%,rgba(240,234,248,0.55),transparent_50%),radial-gradient(ellipse_60%_40%_at_70%_80%,rgba(254,246,224,0.45),transparent_55%)]"
        aria-hidden
      />
      <Header />

      <section className="animate-fade-up mx-auto grid min-h-[calc(100vh-72px)] max-w-[1120px] grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-center gap-10 px-10 pt-[110px] pb-14 max-[860px]:min-h-0 max-[860px]:grid-cols-1 max-[860px]:gap-7 max-[860px]:px-6 max-[860px]:pt-[100px] max-[860px]:pb-12">
        <div className="max-w-[540px]">
          <p className="mb-5 text-[13px] font-bold tracking-[0.14em] text-fg uppercase opacity-55">
            OfficeSync
          </p>
          <h1 className="mb-5 text-[clamp(36px,4.5vw,52px)] leading-[1.12] font-bold tracking-[-0.035em] text-fg">
            Управление офисом на новом уровне
          </h1>
          <p className="mb-7 max-w-[460px] text-[17px] leading-[1.55] font-medium text-fg-secondary">
            Единая платформа для учёта сотрудников, оборудования и планов этажей
            — с аналитикой и AI-помощником.
          </p>
          <div className="mb-7 flex flex-wrap gap-3">
            <Button
              type="button"
              className="h-11 px-5 text-sm"
              onClick={handleCta}
            >
              {userEmail ? "Открыть кабинет" : "Начать работу"}
            </Button>
            {isAdmin && (
              <Button
                type="button"
                variant="secondary"
                className="h-11 px-[18px] text-sm"
                onClick={() => navigate("/admin")}
              >
                Админ-панель
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-tag-green-bg px-2.5 py-1.5 text-xs font-semibold tracking-[-0.01em] text-tag-green">
              Учёт оборудования
            </span>
            <span className="rounded-md bg-tag-yellow-bg px-2.5 py-1.5 text-xs font-semibold tracking-[-0.01em] text-tag-yellow">
              Бронирование
            </span>
            <span className="rounded-md bg-tag-purple-bg px-2.5 py-1.5 text-xs font-semibold tracking-[-0.01em] text-tag-purple">
              AI-аналитика
            </span>
          </div>
        </div>
        <div className="animate-float-in relative flex items-center justify-center max-[860px]:order-[-1] max-[860px]:max-h-[280px]">
          <div className="animate-pulse-glow absolute top-1/2 left-1/2 z-0 h-[70%] w-[70%] -translate-x-1/2 -translate-y-[45%] rounded-full bg-[radial-gradient(circle,rgba(232,246,238,0.9)_0%,transparent_70%)]" />
          <img
            className="relative z-[1] h-auto max-h-[min(520px,70vh)] w-[min(100%,400px)] object-contain pointer-events-none drop-shadow-[0_24px_48px_rgba(17,17,17,0.1)]"
            src={men}
            alt="OfficeSync — управление офисом"
          />
        </div>
      </section>

      <section className="animate-fade-up mx-auto mb-16 max-w-[1120px] rounded-xl border border-line bg-elevated px-10 py-12 shadow-soft max-[960px]:mx-5 max-[960px]:mb-12 max-[960px]:px-6 max-[960px]:py-8 [animation-delay:0.2s]">
        <div>
          <h2 className="mb-3 text-[28px] font-bold tracking-[-0.03em] text-fg">
            Почему выбирают нас
          </h2>
          <p className="mb-9 max-w-[520px] text-base leading-normal font-medium text-fg-secondary">
            Каждая компания уникальна — адаптируем платформу под ваши процессы и
            инфраструктуру.
          </p>
          <div className="grid grid-cols-3 gap-5 max-[800px]:grid-cols-1">
            <div className="flex items-center gap-3.5 rounded-md border border-line bg-bg p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft">
              <div className={iconWrap}>
                <img src={brain} alt="" />
              </div>
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                Поддержка и обучение
              </span>
            </div>
            <div className="flex items-center gap-3.5 rounded-md border border-line bg-bg p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft">
              <div className={iconWrap}>
                <img src={tehno} alt="" />
              </div>
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                Инновационные технологии
              </span>
            </div>
            <div className="flex items-center gap-3.5 rounded-md border border-line bg-bg p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft">
              <div className={iconWrap}>
                <img src={user} alt="" />
              </div>
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                Индивидуальный подход
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-10 pb-10">
        <h2 className="mb-9 text-center text-[28px] font-bold tracking-[-0.03em] text-fg">
          Что мы предлагаем
        </h2>
        <div className="grid grid-cols-3 gap-5 max-[800px]:grid-cols-1">
          <article className="flex flex-col items-start rounded-lg border border-line bg-elevated px-6 py-7 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] hover:-translate-y-[3px] hover:shadow-card">
            <div className={cn(iconWrap, "mb-5 h-12 w-12 bg-tag-blue-bg [&_img]:h-6 [&_img]:w-6")}>
              <img src={monitor} alt="" />
            </div>
            <h3 className="mb-2.5 text-lg font-bold tracking-[-0.02em] text-fg">
              Оборудование
            </h3>
            <p className="text-sm leading-[1.55] font-medium text-fg-secondary">
              Эффективный учёт и распределение техники — меньше затрат, больше
              прозрачности.
            </p>
          </article>
          <article className="flex flex-col items-start rounded-lg border border-line bg-elevated px-6 py-7 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] hover:-translate-y-[3px] hover:shadow-card">
            <div className={cn(iconWrap, "mb-5 h-12 w-12 bg-tag-green-bg [&_img]:h-6 [&_img]:w-6")}>
              <img src={chemodan} alt="" />
            </div>
            <h3 className="mb-2.5 text-lg font-bold tracking-[-0.02em] text-fg">
              Сотрудники
            </h3>
            <p className="text-sm leading-[1.55] font-medium text-fg-secondary">
              Автоматизация учёта, рабочего времени и привязки к офисам и этажам.
            </p>
          </article>
          <article className="flex flex-col items-start rounded-lg border border-line bg-elevated px-6 py-7 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] hover:-translate-y-[3px] hover:shadow-card">
            <div className={cn(iconWrap, "mb-5 h-12 w-12 bg-tag-yellow-bg [&_img]:h-6 [&_img]:w-6")}>
              <img src={arrows} alt="" />
            </div>
            <h3 className="mb-2.5 text-lg font-bold tracking-[-0.02em] text-fg">
              Аналитика
            </h3>
            <p className="text-sm leading-[1.55] font-medium text-fg-secondary">
              Отчёты и графики для оценки ресурсов и обоснованных решений.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;