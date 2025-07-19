import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Leaves } from './leaves.schema';

@Injectable()
export class LeavesService {
  constructor(@InjectConnection() private readonly connection: Connection,@InjectModel(Leaves.name) private leavesModel: Model<Leaves>) {}

  async myLeaves(body): Promise<any> {
    let leavedata=await this.leavesModel.findOne({companyId:body.companyId,branchId:body.branchId,username:body.username})

    if(leavedata){
        return leavedata
    }
    else{

  const settingsCollection = this.connection.collection('settings');
  const settings: any = await settingsCollection.findOne({ type: "leaves" });
                    console.log(settings,"?888888888")

    return settings;
    }

  }
}
