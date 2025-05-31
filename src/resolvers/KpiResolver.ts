import { Arg, Int, Query, Resolver, Mutation } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { KpiSummary } from "../dtos/model/KpiSummary";

@Resolver()
export class KpiResolver {
  private firestore = getFirestore();

  async ensureKpiDocExists(year: number, month: number) {
    const docId = `${year}-${String(month + 1).padStart(2, "0")}`;
    const ref = this.firestore.collection("kpis").doc(docId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      await ref.set({
        pacientes: 0,
        consultas: 0,
        faltas: 0,
        dentistas: 0,
        faturacao: 0,
        updatedAt: new Date().toISOString(),
      });
    }

    return ref;
  }

  @Query(() => KpiSummary)
  async getKpiSummary(
    @Arg("month", () => Int) month: number,
    @Arg("year", () => Int) year: number
  ): Promise<KpiSummary> {
    const docId = `${year}-${String(month + 1).padStart(2, "0")}`;
    const ref = this.firestore.collection("kpis").doc(docId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      const defaultData = {
        pacientes: 0,
        consultas: 0,
        faltas: 0,
        dentistas: 0,
        faturacao: 0,
        updatedAt: new Date().toISOString(),
      };
      await ref.set(defaultData);
      return defaultData;
    }

    const data = snapshot.data()!;
    return {
      pacientes: data.pacientes || 0,
      consultas: data.consultas || 0,
      faltas: data.faltas || 0,
      dentistas: data.dentistas || 0,
      faturacao: data.faturacao || 0,
    };
  }

  async updateKpiUsersCount(year: number, month: number) {
    const docId = `${year}-${String(month + 1).padStart(2, "0")}`;
    const ref = this.firestore.collection("kpis").doc(docId);

    const [patientsSnap, dentistsSnap] = await Promise.all([
      this.firestore.collection("users").where("role", "==", "patient").get(),
      this.firestore.collection("users").where("role", "==", "dentist").get(),
    ]);

    await ref.set(
      {
        pacientes: patientsSnap.size,
        dentistas: dentistsSnap.size,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  async addRevenueToKpi(year: number, month: number, value: number) {
    const ref = await this.ensureKpiDocExists(year, month);

    await this.firestore.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const data = snap.exists ? snap.data()! : {};

      data.faturacao = (data.faturacao || 0) + value;
      data.updatedAt = new Date().toISOString();

      t.set(ref, data);
    });
  }

  @Mutation(() => Boolean)
  async updateKpiResumo(
    @Arg("month", () => Int) month: number,
    @Arg("year", () => Int) year: number
  ): Promise<boolean> {
    await this.updateKpiUsersCount(year, month);
    return true;
  }

  async incrementConsultas(year: number, month: number) {
    const ref = await this.ensureKpiDocExists(year, month);

    await this.firestore.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const data = snap.exists ? snap.data()! : {};

      data.consultas = (data.consultas || 0) + 1;
      data.updatedAt = new Date().toISOString();

      t.set(ref, data);
    });
  }
}
