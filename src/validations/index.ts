import countries from "@/data/countries.json";
import { stringNonEmpty } from "@/utils/zodUtils";
import { z } from "zod";

//? -------- REGEX ---------
export const passRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&*?@])[\d!#$%&*?@A-Za-z]{8,}$/;
export const hexRegex = /[\da-f]{40}$/i;

//? -------- Sub Schema ---------
export const credinalSchema = stringNonEmpty().trim().min(3).max(25);
export const emailSchema = stringNonEmpty().email().trim().toLowerCase();
export const usernameSchema = stringNonEmpty().trim();
export const infoSchema = z.string().trim().min(3).max(25).optional();
export const tokenSchema = stringNonEmpty()
  .length(40, { message: "must be a 40-character string" })
  .regex(hexRegex, { message: "must be a hexadecimal string" });

export const CountrySchema = z.enum(
  [
    countries.countries[0].name,
    ...countries.countries.slice(1).map((country) => country.name),
  ],
  {
    message:
      "The country you enter is not recognized, please enter one of the available countries",
  },
);
