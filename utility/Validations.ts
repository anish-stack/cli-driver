export const validateAndFormatPhone = (number) => {
  if (number) {
    const cleanNumber = number.toString().replace(/\D/g, '');

    const formattedNumber = cleanNumber.startsWith('91')
      ? cleanNumber.substring(2)
      : cleanNumber;

    if (formattedNumber.length !== 10) {
      return {
        isValid: false,
        error: "Please enter a valid 10-digit phone number",
      };
    }

    return {
      isValid: true,
      formattedPhone: formattedNumber,
    };
  }

  return {
    isValid: false,
    error: "Phone number is required",
  };
};
