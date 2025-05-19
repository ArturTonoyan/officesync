import styles from "./Reservation.module.scss";
import { useEffect, useState } from "react";
import { Box, Grid, Typography, Button, TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DateCalendar,
  TimePicker,
} from "@mui/x-date-pickers";
import ruLocale from "date-fns/locale/ru";
import { format } from "date-fns";
import isWithinInterval from "date-fns/isWithinInterval";
import { parse } from "date-fns";

function Reservation() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [sendReservation, setSendReservation] = useState(false);

  const testReserved = [
    {
      date: "2025-05-21",
      startTime: "10:00",
      endTime: "12:00",
      userId: "12sdkfnqowwejnfjklwqef",
      user: {
        id: "12sdkfnqowwejnfjklwqef",
        name: "Вася",
        surname: "Пупкин",
        patronymic: "Петрович",
        email: "H8u9d@example.com",
        position: "Преподаватель",
      },
    },
    {
      date: "2025-05-21",
      startTime: "14:30",
      endTime: "16:10",
      userId: "12sdkweffnqowfjklwqef",
      user: {
        id: "12sdkweffnqowfjklwqef",
        name: "Николай",
        surname: "Каменский",
        patronymic: "Григорьевич",
        email: "osilejf@example.com",
        position: "Администратор",
      },
    },
  ];

  const userColors = [
    "#90caf9", // Голубой
    "#a5d6a7", // Зеленый
    "#ffcc80", // Оранжевый
    "#f48fb1", // Розовый
    "#ce93d8", // Фиолетовый
    "#ffe082", // Желтый
    "#80cbc4", // Бирюзовый
  ];

  const getUserColor = (userId) => {
    // Берем индекс из суммы char-кодов userId
    const hash = [...userId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return userColors[hash % userColors.length];
  };

  const renderTimeSlots = () => {
    const hours = Array.from({ length: 24 }, (_, i) => 0 + i); // 08:00 — 17:00
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

    return hours.map((hour) => {
      const timeLabel = `${hour.toString().padStart(2, "0")}:00`;

      // Проверка, есть ли бронирование в этот час
      const reservation = testReserved.find((res) => {
        if (res.date !== selectedDateStr) return false;

        const slotStart = parse(
          `${res.date} ${res.startTime}`,
          "yyyy-MM-dd HH:mm",
          new Date()
        );
        const slotEnd = parse(
          `${res.date} ${res.endTime}`,
          "yyyy-MM-dd HH:mm",
          new Date()
        );
        const currentHour = parse(
          `${res.date} ${timeLabel}`,
          "yyyy-MM-dd HH:mm",
          new Date()
        );

        return isWithinInterval(currentHour, {
          start: slotStart,
          end: slotEnd,
        });
      });

      const bgColor = reservation
        ? getUserColor(reservation.userId)
        : "transparent";

      return (
        <div key={hour} className={styles.slot}>
          <div className={styles.slotLabel}>{timeLabel}</div>
          {reservation && (
            <div
              className={styles.reservedBlock}
              style={{ backgroundColor: bgColor }}
            >
              {reservation.user.name} {reservation.user.surname}{" "}
              {reservation.startTime} - {reservation.endTime}
            </div>
          )}
        </div>
      );
    });
  };

  const isTimeRangeAvailable = (
    startTime,
    endTime,
    reservations,
    selectedDate
  ) => {
    if (!startTime || !endTime || !selectedDate) return false;
    // Привязываем время к выбранной дате
    const start = new Date(selectedDate);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const end = new Date(selectedDate);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    // ⛔ Проверка: если время окончания раньше или равно началу — недопустимо
    if (end <= start) {
      return false;
    }
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    const hasOverlap = reservations.some((res) => {
      if (res.date !== selectedDateStr) return false;
      const resStart = parse(
        `${res.date} ${res.startTime}`,
        "yyyy-MM-dd HH:mm",
        new Date()
      );
      const resEnd = parse(
        `${res.date} ${res.endTime}`,
        "yyyy-MM-dd HH:mm",
        new Date()
      );
      const overlap =
        (start >= resStart && start < resEnd) || // начало внутри чужого интервала
        (end > resStart && end <= resEnd) || // конец внутри чужого интервала
        (start <= resStart && end >= resEnd); // полностью перекрывает чужой интервал
      return overlap;
    });

    const result = !hasOverlap;
    return result;
  };

  useEffect(() => {
    if (startTime && endTime) {
      const available = isTimeRangeAvailable(
        startTime,
        endTime,
        testReserved,
        selectedDate
      );
      setSendReservation(available);
    }
  }, [startTime, endTime, selectedDate]);

  return (
    <div className={styles.Reservation}>
      <h1>Бронирование кабинетов</h1>
      <div className={styles.reserved_component}>
        <div className={styles.left}>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ruLocale}
          >
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="h6">Выбор даты</Typography>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                />

                <Box mt={2}>
                  <Typography variant="body1">Время начала</Typography>
                  <TimePicker
                    value={startTime}
                    onChange={setStartTime}
                    renderInput={(params) => (
                      <TextField fullWidth {...params} />
                    )}
                  />
                </Box>
                <Box mt={2}>
                  <Typography variant="body1">Время окончания</Typography>
                  <TimePicker
                    value={endTime}
                    onChange={setEndTime}
                    renderInput={(params) => (
                      <TextField fullWidth {...params} />
                    )}
                  />
                </Box>

                <Button
                  sx={{ mt: 2 }}
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    console.log("Дата:", selectedDate);
                    console.log("Промежуток:", startTime, "—", endTime);
                  }}
                  disabled={!sendReservation}
                >
                  Забронировать
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </div>
        <div className={styles.right}>
          <Grid item xs={8}>
            <Typography variant="h5">
              {selectedDate?.toLocaleDateString("ru-RU")}
            </Typography>
            <Box
              sx={{
                borderLeft: "1px solid #ccc",
                height: "80vh",
                overflowY: "auto",
              }}
            >
              {renderTimeSlots()}
            </Box>
          </Grid>
        </div>
      </div>
    </div>
  );
}

export default Reservation;
