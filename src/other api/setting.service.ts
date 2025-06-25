import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from './schemas/setting.schema';

@Injectable()
export class SettingService {
  constructor(@InjectModel(Setting.name) private settingModel: Model<Setting>) {}

  async getAllSettings(): Promise<Setting[]> {
    return this.settingModel.find().exec();
  }

  async getSettingByType(type: string): Promise<any> {
    return this.settingModel.findOne({ type }).exec();
  }
    async postSettingByType(body: any): Promise<any> {
    return this.settingModel.updateOne({ type :"2factor-authentication"},{datavalue:body.twoFAEnabled,email:body.email,appPassword:body.appPassword})
  }
}
