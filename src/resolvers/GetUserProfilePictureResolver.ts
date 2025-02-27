import dotenv from "dotenv";
import { Arg, Query, Resolver } from "type-graphql";
import { getStorage } from "firebase-admin/storage";

import { GetUserProfilePictureInput } from "../dtos/inputs/GetUserProfilePictureInput";

dotenv.config();

@Resolver()
class GetUserProfilePictureResolver {
  private storage = getStorage().bucket(process.env.BUCKET);

  @Query(() => String)
  async getUserProfileImage(
    @Arg("data") { uid, role, sex }: GetUserProfilePictureInput
  ): Promise<string> {
    let imagePath: string;
    if (role === "Pacient") {
      imagePath = `imagens/paciente/${uid}/profile.jpg`;
    } else {
      imagePath = `imagens/staff/${uid}/profile.jpg`;
    }

    let file = this.storage.file(imagePath);
    const [exists] = await file.exists();

    if (!exists) {
      if (sex === "M") {
        imagePath = `imagens/noProfileM.jpg`;
      } else {
        imagePath = `imagens/noProfileW.jpg`;
      }
      file = this.storage.file(imagePath);
    }

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    return url;
  }
}

export default GetUserProfilePictureResolver;
