import { Arg, Mutation, Resolver } from "type-graphql";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

@Resolver()
class UpdateUserProfileImageResolver {
  private storage = getStorage().bucket(process.env.BUCKET);
  private firestore = getFirestore();

  @Mutation(() => String)
  async uploadProfilePicture(
    @Arg("file", () => String) fileBase64: string,
    @Arg("userId") userId: string
  ): Promise<string> {
    try {
      if (!fileBase64.startsWith("data:image")) {
        throw new Error("Formato inválido. Apenas imagens são permitidas.");
      }

      const matches = fileBase64.match(/^data:(image\/\w+);base64,/);
      if (!matches) throw new Error("Formato de imagem inválido.");

      const fileType = matches[1].split("/")[1];
      const filename = `users/${userId}/${uuidv4()}.${fileType}`;

      const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const file = this.storage.file(filename);

      await file.save(buffer, {
        metadata: { contentType: `image/${fileType}` },
      });

      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 100,
      });

      await this.firestore.collection("users").doc(userId).update({
        profileImage: url,
      });

      return url;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      throw new Error("Falha no upload da imagem.");
    }
  }
}

export default UpdateUserProfileImageResolver;
