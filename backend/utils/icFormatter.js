export const formatICWithHyphen = (ic) => {
  if (!ic) return ic;
  const digits = ic.toString().replace(/\D/g, '');
  if (digits.length !== 12) return ic;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

