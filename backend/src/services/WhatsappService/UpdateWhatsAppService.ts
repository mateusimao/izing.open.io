import * as Yup from "yup";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";

interface WhatsappData {
  name?: string;
  status?: string;
  session?: string;
  isDefault?: boolean;
  tokenTelegram?: string;
  instagramUser?: string;
  instagramKey?: string;
}

interface Request {
  whatsappData: WhatsappData;
  whatsappId: string;
  tenantId: string | number;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const UpdateWhatsAppService = async ({
  whatsappData,
  whatsappId,
  tenantId
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    isDefault: Yup.boolean()
  });

  const {
    name,
    status,
    isDefault,
    session,
    tokenTelegram,
    instagramUser,
    instagramKey
  } = whatsappData;

  try {
    await schema.validate({ name, status, isDefault });
  } catch (err) {
    throw new AppError(err.message);
  }

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: { isDefault: true, tenantId, id: { [Op.not]: whatsappId } }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false });
    }
  }

  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId, tenantId }
  });

  if (!whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  const data: WhatsappData = {
    name,
    status,
    session,
    isDefault,
    tokenTelegram,
    instagramUser
  };

  if (instagramKey) {
    data.instagramKey = instagramKey;
  }

  await whatsapp.update(data);

  return { whatsapp, oldDefaultWhatsapp };
};

export default UpdateWhatsAppService;
