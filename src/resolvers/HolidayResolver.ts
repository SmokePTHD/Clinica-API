import { Arg, Query, Resolver } from "type-graphql";
import { Holiday } from "../dtos/model/Holiday";
import moment from "moment";
import holidaysData from "../data/holidays-braga.json";

function calculateEasterDate(year: number): Date {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

@Resolver()
export class HolidayResolver {
  @Query(() => [Holiday])
  async getHolidaysByInterval(
    @Arg("dateStart") dateStart: string,
    @Arg("dateEnd") dateEnd: string
  ): Promise<Holiday[]> {
    const yearStart = new Date(dateStart).getFullYear();
    const yearEnd = new Date(dateEnd).getFullYear();
    const results: Holiday[] = [];

    for (let year = yearStart; year <= yearEnd; year++) {
      holidaysData.forEach((h) => {
        const fullDate = `${year}-${h.date}`;
        if (fullDate >= dateStart && fullDate <= dateEnd) {
          results.push({ title: h.title, date: fullDate });
        }
      });

      const easter = calculateEasterDate(year);
      const goodFriday = moment(easter)
        .subtract(2, "days")
        .format("YYYY-MM-DD");
      const easterSunday = moment(easter).format("YYYY-MM-DD");
      const corpusChristi = moment(easter).add(60, "days").format("YYYY-MM-DD");

      [
        { title: "Sexta-feira Santa", date: goodFriday },
        { title: "Domingo de Páscoa", date: easterSunday },
        { title: "Corpo de Deus", date: corpusChristi },
      ].forEach((h) => {
        if (h.date >= dateStart && h.date <= dateEnd) {
          results.push(h);
        }
      });
    }

    return results;
  }
}
