export const getFormattedDateTime = (dateObj = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  const hh = pad(dateObj.getHours());
  const mm = pad(dateObj.getMinutes());
  const dd = pad(dateObj.getDate());
  const month = pad(dateObj.getMonth() + 1);
  const yyyy = dateObj.getFullYear();
  return `${hh}:${mm} ${dd}/${month}/${yyyy}`;
};
