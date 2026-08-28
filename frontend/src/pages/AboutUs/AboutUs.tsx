import Header from "../../modules/Header/Header";
import styles from "./AboutUs.module.scss";
import brain from "@assets/images/icons/brain.svg";
import tehno from "@assets/images/icons/tehno.svg";
import user from "@assets/images/icons/user.svg";
import men from "@assets/images/aboutUs/men.png";
import chemodan from "@assets/images/icons/chemodan.svg";
import monitor from "@assets/images/icons/monitor.svg";
import arrows from "@assets/images/icons/arrows.svg";

function AboutUs() {
  return (
    <div className={styles.AboutUs}>
      <Header />
      <h1>Управление офисом на новом уровне!</h1>
      <h2>
        Наша цель — помочь компаниям улучшить учёт сотрудников и оптимизировать
        использование офисного оборудования. Мы понимаем, что правильное
        управление ресурсами является ключом к успеху любого бизнеса.
      </h2>
      <div className={styles.blok2}>
        <div className={styles.first}>
          <h3>Почему выбирают нас?</h3>
          <h4>
            Каждая компания уникальна, и мы адаптируем наши услуги под
            конкретные потребности и требования
          </h4>
          <div className={styles.list}>
            <div className={styles.item}>
              <img src={brain} alt="brain" />
              <span>Поддержка и обучение</span>
            </div>
            <div className={styles.item}>
              <img src={tehno} alt="brain" />
              <span>Инновационные технологии</span>
            </div>
            <div className={styles.item}>
              <img src={user} alt="brain" />
              <span>Индивидуальный подход</span>
            </div>
          </div>
        </div>
        <div className={styles.second}>
          <img src={men} alt="men" />
        </div>
      </div>
      <div className={styles.blok3}>
        <h3>Что мы предлагаем?</h3>
        <div className={styles.boxs}>
          <div className={styles.box}>
            <img src={monitor} alt="men" />
            <span>Оптимизация управления оборудованием</span>
            <p>
              обеспечить эффективный учет и распределение офисной техники, что
              способствует снижению затрат и повышению эффективности
            </p>
          </div>
          <div className={styles.box}>
            <img src={chemodan} alt="men" />
            <span>Автоматизация учета сотрудников</span>
            <p>
              упростить процесс регистрации рабочего времени, посещаемости и
              производительности.
            </p>
          </div>
          <div className={styles.box}>
            <img src={arrows} alt="men" />
            <span>Автоматическое создание отчетностей</span>
            <p>
              Предоставлять аналитические инструменты для оценки использования
              ресурсов и принятия обоснованных решений.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
