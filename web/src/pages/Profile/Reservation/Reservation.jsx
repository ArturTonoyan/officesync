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
import { format, isWithinInterval, parse, parseISO } from "date-fns";
import ConvasSpace from "../../Constructor/modules/ConvasSpace/ConvasSpace";
import { useSelector } from "react-redux";
import { apiCreateReserveds, apiGetReserveds } from "../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";

function Reservation() {
  const user = useSelector((state) => state.user.user.data);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [sendReservation, setSendReservation] = useState(false);
  const [reservedsDate, setReservedsDate] = useState([]);

  const { data: reserveds, refetch: refetchReserveds } = useQuery({
    queryKey: ["reserveds", selectedDate, selectedRoom?.id],
    queryFn: () =>
      apiGetReserveds(
        selectedDate?.toLocaleDateString("ru-RU"),
        selectedRoom?.id
      ),
    staleTime: Infinity,
    enabled: !!selectedRoom?.id && !!selectedDate,
  });

  useEffect(() => {
    setReservedsDate(reserveds?.data || []);
  }, [reserveds]);

  useEffect(() => {
    refetchReserveds();
  }, [selectedDate]);

  const userColors = [
    "#90caf9",
    "#a5d6a7",
    "#ffcc80",
    "#f48fb1",
    "#ce93d8",
    "#ffe082",
    "#80cbc4",
  ];

  const getUserColor = (userId) => {
    const hash = [...userId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return userColors[hash % userColors.length];
  };

  const renderTimeSlots = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

    return hours.map((hour) => {
      const timeLabel = `${hour.toString().padStart(2, "0")}:00`;

      const reservation = reservedsDate?.find((res) => {
        // Преобразуем "22.05.2025" -> "2025-05-22"
        const parsedDate = parse(res.date, "dd.MM.yyyy", new Date());
        const resDateStr = format(parsedDate, "yyyy-MM-dd");
        if (resDateStr !== selectedDateStr) return false;

        const slotStart = parse(
          `${resDateStr} ${res.startTime}`,
          "yyyy-MM-dd HH:mm:ss",
          new Date()
        );
        const slotEnd = parse(
          `${resDateStr} ${res.endTime}`,
          "yyyy-MM-dd HH:mm:ss",
          new Date()
        );
        const currentHour = parse(
          `${resDateStr} ${timeLabel}`,
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
          {reservation && reservation.user && (
            <div
              className={styles.reservedBlock}
              style={{ backgroundColor: bgColor }}
            >
              {reservation.user.name} {reservation.user.surname}
              <br />
              {reservation.startTime.slice(0, 5)} -{" "}
              {reservation.endTime.slice(0, 5)}
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

    const start = new Date(selectedDate);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const end = new Date(selectedDate);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (end <= start) return false;

    return !reservations?.some((res) => {
      const resDate = parse(res.date, "dd.MM.yyyy", new Date());
      const resDateStr = format(resDate, "yyyy-MM-dd");
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

      if (resDateStr !== selectedDateStr) return false;

      const resStart = parse(
        `${resDateStr} ${res.startTime}`,
        "yyyy-MM-dd HH:mm:ss",
        new Date()
      );
      const resEnd = parse(
        `${resDateStr} ${res.endTime}`,
        "yyyy-MM-dd HH:mm:ss",
        new Date()
      );

      return (
        (start >= resStart && start < resEnd) ||
        (end > resStart && end <= resEnd) ||
        (start <= resStart && end >= resEnd)
      );
    });
  };

  useEffect(() => {
    if (startTime && endTime) {
      const available = isTimeRangeAvailable(
        startTime,
        endTime,
        reservedsDate,
        selectedDate
      );
      setSendReservation(available);
    }
  }, [startTime, endTime, selectedDate]);

  const funReserved = () => {
    const data = {
      startTime: startTime?.toLocaleTimeString("ru-RU"),
      endTime: endTime?.toLocaleTimeString("ru-RU"),
      date: selectedDate?.toLocaleDateString("ru-RU"),
      elementId: selectedRoom?.id,
      userId: user?.id,
    };
    apiCreateReserveds(data).then((res) => {
      if (res.status === 201) {
        refetchReserveds();
      }
    });
  };

  return (
    <div className={styles.Reservation}>
      <h1>Бронирование кабинетов</h1>

      <div className={styles.reserved_component}>
        <div className={styles.left}>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ruLocale}
          >
            <Grid container spacing={2} sx={{ height: "100%" }}>
              <Grid
                item
                xs={4}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
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
                  onClick={funReserved}
                  disabled={!sendReservation}
                >
                  Забронировать
                </Button>

                {selectedRoom && (
                  <div className={styles.selected_room}>
                    <span>Выбранный объект:</span>
                    <p>Название: {selectedRoom?.name}</p>
                    <p>Тип: {selectedRoom?.type}</p>
                  </div>
                )}
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

      <div className={styles.canvas_container}>
        <ConvasSpace noedit={true} setSelectedRoom={setSelectedRoom} />
      </div>
    </div>
  );
}

export default Reservation;
