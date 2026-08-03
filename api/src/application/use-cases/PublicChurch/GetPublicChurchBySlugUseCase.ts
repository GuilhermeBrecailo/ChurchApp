import { $prismaClient } from "../../../../config/database";

export class GetPublicChurchBySlugUseCase {
  async execute(slug: string) {
    const church = await $prismaClient.crunch.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        accentColor: true,
        isActive: true,
        city: true,
        state: true,
        road: true,
        number: true,
        complement: true,
        localZipCode: true,
        phone: true,
        whatsapp: true,
        email: true,
        instagram: true,
        facebook: true,
        youtube: true,
        website: true,
      },
    });

    if (!church || !church.isActive) {
      return null;
    }

    return church;
  }
}