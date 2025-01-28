import { Arg, Mutation, Resolver } from "type-graphql";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import { AddUserModel } from "../dtos/model/AddUserModel";
import { AddUserInputs } from "../dtos/inputs/AddUserInputs";

@Resolver()
export class AddNewUserResolver {
    private firestore = getFirestore();
    private auth = getAuth();

    @Mutation(() => AddUserModel)
    async addNewUser(
        @Arg("data") { address, birthDate, email, name, nif, note, phone, role }: AddUserInputs
    ): Promise<AddUserModel> {
        try {
            const userRecord = await this.auth.createUser({
                email,
                password: nif.toString(),
                displayName: name,
            });

            const userDoc = this.firestore.collection("users").doc(userRecord.uid);
            await userDoc.set({
                address: address,
                birthDate: birthDate,
                email: email,
                name: name,
                nif: nif,
                note: note,
                phone: phone,
                role: role,
                uid: userRecord.uid,
            });

            return {
                success: true,
                message: `Usuário ${name} criado com sucesso`,
            };
        } catch (error) {
            console.error("Erro ao criar novo usuário:", error);
            throw new Error("Não foi possível criar o novo usuário.");
        }
    }
}