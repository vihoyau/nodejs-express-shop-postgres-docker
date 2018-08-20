import { DataTypes, Sequelize } from "sequelize"
import { getModel } from "../../lib/global"
//�μ��ռ����߻
const modelName = "mall.usercollection"
export const defineFunction = function (sequelize: Sequelize) {
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        Useruuid: DataTypes.UUID,//�û�uuid
        Activityuuid: DataTypes.UUID,//�uuid
        CardAmount: DataTypes.INTEGER,//�ռ��ɹ��Ŀ���������
        CardIdAmounts: DataTypes.JSONB,//�ռ��ɹ�����1,2,3,4,5����
        ChipIdAmounts: DataTypes.JSONB,//��Ƭ1��2,3,4��5����
        CollectionPassUserId: DataTypes.ARRAY(DataTypes.STRING),//�Ұ��˭�ռ�����
        CollectionGetUserId: DataTypes.ARRAY(DataTypes.STRING),//˭������ռ�����
        CollectionState: DataTypes.INTEGER,//�ռ�״̬,δ�μӣ��μ��У��Ѽ���(0,1,2)
        ChipUserId: DataTypes.ARRAY(DataTypes.STRING),//�Ұ��˭�ռ���Ƭ
        ByChipUserId: DataTypes.ARRAY(DataTypes.STRING),//˭������ռ���Ƭ
        createTime: DataTypes.TIME,//����ʱ��
        UserCollection: DataTypes.ARRAY(DataTypes.STRING),//��ռ���¼
        rewardtimestamp: DataTypes.TIME,//�һ�ʱ��
    }, {
            timestamps: false,
            schema: "mall",
            freezeTableName: true,
            tableName: "usercollection"
        })
}
//�û��μӻ
export async function addUserCollection(addUserCollections: any) {
    try {
        console.log(addUserCollections)
        let res = await getModel(modelName).create(addUserCollections, { returning: true })
        return res ? res.get() : undefined
    } catch (e) {
        throw new Error(e)
    }

}
//��ѯ���û��Ƿ�μӹ��û
export async function selectUserCollection(selectUserCollections: any) {
    try {
        console.log(selectUserCollections)
        let res = await getModel(modelName).findOne({ where: { Useruuid: selectUserCollections.Useruuid, Activityuuid: selectUserCollections.Activityuuid } });
        return res ? res.get() : undefined
    } catch (e) {
        throw new Error(e)
    }

}
//����û�İ�æ��
export async function insertUserCollection(Activityuuid:any,Useruuid:any) {
    try {
        //��ѯĳ����İ�æ¼�����Ƿ�Ϊ��
        let coll: any = await getModel("mall.collectioncreate").findOne({ where: { uuid: Activityuuid } });
        let collectiondone=coll.collectiondone
        if(!collectiondone){
            collectiondone=[]
            collectiondone.push(Useruuid)
        }else{
            collectiondone.push(Useruuid)
        }
        let res = await getModel("mall.collectioncreate").update({collectiondone},{ where: { uuid: Activityuuid } });
        return res
    } catch (e) {
        throw new Error(e)
    }

}
//添加领奖人数
export async function insertrewardDone(Activityuuid:any,rewardDone:any) {
    try {
        let res = await getModel("mall.collectioncreate").update({rewardDone},{ where: { uuid: Activityuuid } });
        return res
    } catch (e) {
        throw new Error(e)
    }

}


//��ѯ���û��Ƿ�����ϼ��ռ�����Ƭ
export async function selectUserCollectionChips(selectUserCollections: any) {
    try {
        console.log(selectUserCollections)
        let res = await getModel(modelName).findOne({ where: { uuid: selectUserCollections.Useruuid, Activityuuid: selectUserCollections.Activityuuid } });
        return res ? res.get() : undefined
    } catch (e) {
        throw new Error(e)
    }

}
//��ѯ���û��Ƿ�����ռ����ÿ���
export async function selectUserCollectionCard(selectUserCollectionCards: any) {
    try {
        console.log(selectUserCollectionCards)
        let res = await getModel(modelName).findOne({ where: { Useruuid: selectUserCollectionCards.UserId, Activityuuid: selectUserCollectionCards.Activityuuid } });
        return res ? res.get() : undefined
    } catch (e) {
        throw new Error(e)
    }

}
//�μӻ���û��Կ��ƽ����ռ�
export async function UserCollectionCard(UserCollectionCards: any) {
    try {
        console.log(UserCollectionCards)
        let CollectionState = UserCollectionCards.CollectionState
        let CardAmount = 1
        let rs: any = await getModel("mall.collectioncreate").findOne({ where: { uuid: UserCollectionCards.Activityuuid } });
        let CardProbability = rs.CardProbability
        let CardIdAmounts;
        let ChipIdAmounts;
        let card = Math.random();
        let cardProbability1 = parseFloat(CardProbability.cardProbability1)
        let cardProbability2 = parseFloat(CardProbability.cardProbability2)
        let cardProbability3 = parseFloat(CardProbability.cardProbability3)
        let cardProbability4 = parseFloat(CardProbability.cardProbability4)
        let cardp12 = cardProbability2 + cardProbability1
        let cardp123 = cardProbability2 + cardProbability1 + cardProbability3
        let cardp1234 = cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4
        //���ݲ�ͬ�Ŀ��ƹ����Ƶ�json��ʼֵ
        switch (rs.CardIdAmounts) {
            case 5: {
                if (card < cardProbability1 && card >= 0) {
                    //��һ���ռ��������
                    CardIdAmounts = { card1: 1, card2: 0, card3: 0, card4: 0, card5: 0 }
                }
                else if (card < (cardp12) && card >= cardProbability1) {
                    CardIdAmounts = { card1: 0, card2: 1, card3: 0, card4: 0, card5: 0 }
                }
                else if (card < (cardp123) && card >= (cardp12)) {
                    CardIdAmounts = { card1: 0, card2: 0, card3: 1, card4: 0, card5: 0 }
                }
                else if (card < (cardp1234) && card >= (cardp123)) {
                    CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 1, card5: 0 }
                }
                else if (card < 1 && card > (cardp1234)) {
                    CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 1 }
                }
                break;
            }
            case 6: {

                let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                let cardp12345 = cardp1234 + cardProbability5
                if (card < cardProbability1 && card >= 0) {
                    //��һ���ռ��������
                    CardIdAmounts = { card1: 1, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0 }
                }
                else if (card < (cardp12) && card >= cardProbability1) {
                    CardIdAmounts = { card1: 0, card2: 1, card3: 0, card4: 0, card5: 0, card6: 0 }
                }
                else if (card < (cardp123) && card >= (cardp12)) {
                    CardIdAmounts = { card1: 0, card2: 0, card3: 1, card4: 0, card5: 0, card6: 0 }
                }
                else if (card < (cardp1234) && card >= (cardp123)) {
                    CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 1, card5: 0, card6: 0 }
                }
                else if (card < (cardp12345) && card >= (cardp1234)) {
                    CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 1, card6: 0 }
                }
                else if (card < 1 && card >= (cardp12345)) {
                    CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 1 }
                }
                break;
            }
            case 7:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardp12345 = cardp1234 + cardProbability5
                    let cardp123456 = cardp12345 + cardProbability6
                    if (card < cardProbability1 && card >= 0) {

                        CardIdAmounts = { card1: 1, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0 }
                    }
                    else if (card < (cardp12) && card >= cardProbability1) {
                        CardIdAmounts = { card1: 0, card2: 1, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0 }
                    }
                    else if (card < (cardp123) && card >= (cardp12)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 1, card4: 0, card5: 0, card6: 0, card7: 0 }
                    }
                    else if (card < (cardp1234) && card >= (cardp123)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 1, card5: 0, card6: 0, card7: 0 }
                    }
                    else if (card < (cardp12345) && card >= (cardp1234)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 1, card6: 0, card7: 0 }
                    }
                    else if (card < (cardp123456) && card >= (cardp12345)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 1, card7: 0 }
                    }
                    else if (card < 1 && card >= (cardp123456)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 1 }
                    }
                    break;
                }
            case 8:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardProbability7 = parseFloat(CardProbability.cardProbability7)
                    let cardp12345 = cardp1234 + cardProbability5
                    let cardp123456 = cardp12345 + cardProbability6
                    let cardp1234567 = cardp123456 + cardProbability7
                    if (card < cardProbability1 && card >= 0) {
                        //��һ���ռ��������
                        CardIdAmounts = { card1: 1, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0 }
                    }
                    else if (card < (cardp12) && card >= cardProbability1) {
                        CardIdAmounts = { card1: 0, card2: 1, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0 }
                    }
                    else if (card < (cardp123) && card >= (cardp12)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 1, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0 }
                    }
                    else if (card < (cardp1234) && card >= (cardp123)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 1, card5: 0, card6: 0, card7: 0, card8: 0 }
                    }
                    else if (card < (cardp12345) && card >= (cardp1234)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 1, card6: 0, card7: 0, card8: 0 }
                    }
                    else if (card < (cardp123456) && card >= (cardp12345)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 1, card7: 0, card8: 0 }
                    }
                    else if (card < (cardp1234567) && card >= (cardp123456)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 1, card8: 0 }
                    }
                    else if (card < 1 && card >= (cardp1234567)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 1 }
                    }
                    break;
                }
            case 9:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardProbability7 = parseFloat(CardProbability.cardProbability7)
                    let cardProbability8 = parseFloat(CardProbability.cardProbability8)
                    if (card < cardProbability1 && card >= 0) {
                        //��һ���ռ��������
                        CardIdAmounts = { card1: 1, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0 }
                    }
                    else if (card < (cardProbability2 + cardProbability1) && card >= cardProbability1) {
                        CardIdAmounts = { card1: 0, card2: 1, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0 }
                    }
                    else if (card < (cardProbability2 + cardProbability1 + cardProbability3) && card >= (cardProbability1 + cardProbability2)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 1, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0 }
                    }
                    else if (card < (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4) && card >= (cardProbability2 + cardProbability1 + cardProbability3)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 1, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0 }
                    }
                    else if (card < (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5) && card >= (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 1, card6: 0, card7: 0, card8: 0, card9: 0 }
                    }
                    else if (card < (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5 + cardProbability6) && card >= (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 1, card7: 0, card8: 0, card9: 0 }
                    }
                    else if (card < (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5 + cardProbability6 + cardProbability7) && card >= (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5 + cardProbability5)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 1, card8: 0, card9: 0 }
                    }
                    else if (card < (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5 + cardProbability6 + cardProbability7 + cardProbability8) && card >= (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5 + cardProbability6 + cardProbability7)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 1, card9: 0 }
                    }
                    else if (card < 1 && card >= (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5 + cardProbability6 + cardProbability7 + cardProbability8)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 1 }
                    }
                    break;
                }
            case 10:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardProbability7 = parseFloat(CardProbability.cardProbability7)
                    let cardProbability8 = parseFloat(CardProbability.cardProbability8)
                    let cardProbability9 = parseFloat(CardProbability.cardProbability9)
                    let cardp12345 = cardp1234 + cardProbability5
                    let cardp123456 = cardp12345 + cardProbability6
                    let cardp1234567 = cardp123456 + cardProbability7
                    let cardp12345678 = cardp1234567 + cardProbability8
                    let cardp123456789 = cardp12345678 + cardProbability9
                    if (card < cardProbability1 && card >= 0) {
                        //��һ���ռ��������
                        CardIdAmounts = { card1: 1, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0 , card10: 0}
                    }
                    else if (card < (cardp12) && card >= cardProbability1) {
                        CardIdAmounts = { card1: 0, card2: 1, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0 , card10: 0}
                    }
                    else if (card < (cardp123) && card >= (cardp12)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 1, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0, card10: 0 }
                    }
                    else if (card < (cardp1234) && card >= (cardp123)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 1, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0 , card10: 0}
                    }
                    else if (card < (cardp12345) && card >=(cardp1234)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 1, card6: 0, card7: 0, card8: 0, card9: 0 , card10: 0}
                    }
                    else if (card < (cardp123456) && card >= (cardp12345)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 1, card7: 0, card8: 0, card9: 0, card10: 0 }
                    }
                    else if (card < (cardp1234567) && card >= (cardp123456)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 1, card8: 0, card9: 0, card10: 0 }
                    }
                    else if (card < (cardp123456789) && card >= (cardProbability2 + cardProbability1 + cardProbability3 + cardProbability4 + cardProbability5 + cardProbability6 + cardProbability7 + cardProbability8)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 1, card9: 0, card10: 0 }
                    }
                    else if (card < 1 && card >= (cardp123456789)) {
                        CardIdAmounts = { card1: 0, card2: 0, card3: 0, card4: 0, card5: 0, card6: 0, card7: 0, card8: 0, card9: 0, card10: 1  }
                    }
                    break;
                }

        }
         //���ݲ�ͬ�Ŀ��ƹ�����Ƭ��Ƶ�json��ʼֵ
         switch (rs.CardIdAmounts) {
            case 5: {
                ChipIdAmounts = { chip1: 0, chip2: 0, chip3: 0, chip4: 0, chip5: 0}
                break;
            }
            case 6: {
                ChipIdAmounts = { chip1: 0, chip2: 0, chip3: 0, chip4: 0, chip5: 0, chip6: 0 }
                
                break;
            }
            case 7:
                {
                    ChipIdAmounts = { chip1: 0, chip2: 0, chip3: 0, chip4: 0, chip5: 0, chip6: 0, chip7: 0 }
                    break;
                }
            case 8:
                {
                    ChipIdAmounts = { chip1: 0, chip2: 0, chip3: 0, chip4: 0, chip5: 0, chip6: 0, chip7: 0, chip8: 0 }
                    break;
                }
            case 9:
                {
                    ChipIdAmounts = { chip1: 0, chip2: 0, chip3: 0, chip4: 0, chip5: 0, chip6: 0, chip7: 0, chip8: 0, chip9: 0 }
                    break;
                }
            case 10:
                {
                    ChipIdAmounts = { chip1: 0, chip2: 0, chip3: 0, chip4: 0, chip5: 0, chip6: 0, chip7: 0, chip8: 0, chip9: 0,chip10:0 }
                    break;
                }

        }
        await getModel(modelName).update({ CardIdAmounts: CardIdAmounts, ChipIdAmounts,CardAmount: CardAmount, CollectionState: CollectionState },
            { where: { Useruuid: UserCollectionCards.Useruuid, Activityuuid: UserCollectionCards.Activityuuid } });
        let res = await getModel(modelName).findOne({ where: { Useruuid: UserCollectionCards.Useruuid, Activityuuid: UserCollectionCards.Activityuuid } })
        return res
    } catch (e) {
        console.log(1111111)
        throw new Error(e)
    }
}
//��ѯ���û��Ƿ��ڸû�ռ�������
export async function UserCollectedCard(UserCollectedCards: any) {
    try {
        console.log(UserCollectedCards)
        let res: any = await getModel(modelName).findOne({ where: { uuid: UserCollectedCards.Useruuid, Activityuuid: UserCollectedCards.Activityuuid } });
        let ress = res.CardIdAmounts
        return ress ? ress.get() : undefined
    } catch (e) {
        throw new Error(e)
    }
}
//�����ղؿ���
export async function UserCollectionCardHelp(UserCollectionCards: any) {
    try {
        console.log(UserCollectionCards)
        let rs: any = await getModel("mall.collectioncreate").findOne({ where: { uuid: UserCollectionCards.Activityuuid } });
        //��ȡ�ÿ��Ƹ���
        let CardProbability = rs.CardProbability
        //��ѯ��������Ϣ
        let Col: any = await getModel(modelName)
            .findOne({ where: { Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
        //�Կ���������һ
        let CardAmount = Col.CardAmount;
        CardAmount++;
        //��ȡ��ÿ����������
        let CardIdAmounts = Col.CardIdAmounts;
        let card = Math.random();
        let cardProbability1 = parseFloat(CardProbability.cardProbability1)
        let cardProbability2 = parseFloat(CardProbability.cardProbability2)
        let cardProbability3 = parseFloat(CardProbability.cardProbability3)
        let cardProbability4 = parseFloat(CardProbability.cardProbability4)
        let cardP12 = cardProbability1 + cardProbability2
        let cardP123 = cardP12 + cardProbability3
        let cardP1234 = cardP123 + cardProbability4
        let whichCollectionCard: any;
        //���ݲ�ͬ�Ŀ��ƹ����Ƶ�json��ʼֵ
        switch (rs.CardIdAmounts) {
            case 5: {
                if (card < cardProbability1 && card >= 0) {
                    //�����ռ��������
                    CardIdAmounts.card1++;
                    whichCollectionCard = rs.Filename[0]
                }
                else if (card < (cardP12) && card >= cardProbability1) {

                    CardIdAmounts.card2++;
                    whichCollectionCard = rs.Filename[1]
                }
                else if (card < (cardP123) && card > (cardP12)) {
                    CardIdAmounts.card3++;
                    whichCollectionCard = rs.Filename[2]
                }
                else if (card < (cardP1234) && card > (cardP123)) {
                    CardIdAmounts.card4++;
                    whichCollectionCard = rs.Filename[3]
                }
                else if (card < 1 && card > (cardP1234)) {
                    CardIdAmounts.card5++;
                    whichCollectionCard = rs.Filename[4]
                }
                break;
            }
            case 6: {

                let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                let cardP12345 = cardP1234 + cardProbability5
                if (card < cardProbability1 && card >= 0) {
                    CardIdAmounts.card1++;
                    whichCollectionCard = rs.Filename[0]
                }
                else if (card < (cardP12) && card >= cardProbability1) {
                    CardIdAmounts.card2++;
                    whichCollectionCard = rs.Filename[1]
                }
                else if (card < (cardP123) && card > (cardP12)) {
                    CardIdAmounts.card3++;
                    whichCollectionCard = rs.Filename[2]
                }
                else if (card < (cardP1234) && card > (cardP123)) {
                    CardIdAmounts.card4++;
                    whichCollectionCard = rs.Filename[3]
                }
                else if (card < (cardP12345) && card > (cardP1234)) {
                    CardIdAmounts.card5++;
                    whichCollectionCard = rs.Filename[4]
                }
                else if (card < 1 && card > (cardP12345)) {
                    CardIdAmounts.card6++;
                    whichCollectionCard = rs.Filename[5]
                }
                break;
            }
            case 7:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardP12345 = cardP1234 + cardProbability5
                    let cardP123456 = cardP12345 + cardProbability6
                    if (card < cardProbability1 && card >= 0) {
                        CardIdAmounts.card1++;
                        whichCollectionCard = rs.Filename[0]
                    }
                    else if (card < (cardP12) && card >= cardProbability1) {
                        CardIdAmounts.card2++;
                        whichCollectionCard = rs.Filename[1]
                    }
                    else if (card < (cardP123) && card > (cardP12)) {
                        CardIdAmounts.card3++;
                        whichCollectionCard = rs.Filename[2]
                    }
                    else if (card < (cardP1234) && card > (cardP123)) {
                        CardIdAmounts.card4++;
                        whichCollectionCard = rs.Filename[3]
                    }
                    else if (card < (cardP12345) && card > (cardP1234)) {
                        CardIdAmounts.card5++;
                        whichCollectionCard = rs.Filename[4]
                    }
                    else if (card < (cardP123456) && card > (cardP12345)) {
                        CardIdAmounts.card6++;
                        whichCollectionCard = rs.Filename[5]
                    }
                    else if (card < 1 && card > (cardP123456)) {
                        CardIdAmounts.card7++;
                        whichCollectionCard = rs.Filename[6]
                    }
                    break;
                }
            case 8:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardProbability7 = parseFloat(CardProbability.cardProbability7)
                    let cardP12345 = cardP1234 + cardProbability5
                    let cardP123456 = cardP12345 + cardProbability6
                    let cardP1234567 = cardP123456 + cardProbability7
                    if (card < cardProbability1 && card >= 0) {
                        CardIdAmounts.card1++;
                        whichCollectionCard = rs.Filename[0]
                    }
                    else if (card < (cardP12) && card >= cardProbability1) {
                        CardIdAmounts.card2++;
                        whichCollectionCard = rs.Filename[1]
                    }
                    else if (card < (cardP123) && card > (cardP12)) {
                        CardIdAmounts.card3++;
                        whichCollectionCard = rs.Filename[2]
                    }
                    else if (card < (cardP1234) && card > (cardP123)) {
                        CardIdAmounts.card4++;
                        whichCollectionCard = rs.Filename[3]
                    }
                    else if (card < (cardP12345) && card > (cardP1234)) {
                        CardIdAmounts.card5++;
                        whichCollectionCard = rs.Filename[4]
                    }
                    else if (card < (cardP123456) && card > (cardP12345)) {
                        CardIdAmounts.card6++;
                        whichCollectionCard = rs.Filename[5]
                    }
                    else if (card < (cardP1234567) && card > (cardP123456)) {
                        CardIdAmounts.card7++;
                        whichCollectionCard = rs.Filename[6]
                    }
                    else if (card < 1 && card > (cardP1234567)) {
                        CardIdAmounts.card8++;
                        whichCollectionCard = rs.Filename[7]
                    }
                    break;
                }
            case 9:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardProbability7 = parseFloat(CardProbability.cardProbability7)
                    let cardProbability8 = parseFloat(CardProbability.cardProbability8)
                    let cardP12345 = cardP1234 + cardProbability5
                    let cardP123456 = cardP12345 + cardProbability6
                    let cardP1234567 = cardP123456 + cardProbability7
                    let cardP12345678 = cardP1234567 + cardProbability8
                    if (card < cardProbability1 && card >= 0) {
                        CardIdAmounts.card1++;
                        whichCollectionCard = rs.Filename[0]
                    }
                    else if (card < (cardP12) && card >= cardProbability1) {
                        CardIdAmounts.card2++;
                        whichCollectionCard = rs.Filename[1]
                    }
                    else if (card < (cardP123) && card > (cardP12)) {
                        CardIdAmounts.card3++;
                        whichCollectionCard = rs.Filename[2]
                    }
                    else if (card < (cardP1234) && card > (cardP123)) {
                        CardIdAmounts.card4++;
                        whichCollectionCard = rs.Filename[3]
                    }
                    else if (card < (cardP12345) && card > (cardP1234)) {
                        CardIdAmounts.card5++;
                        whichCollectionCard = rs.Filename[4]
                    }
                    else if (card < (cardP123456) && card > (cardP12345)) {
                        CardIdAmounts.card6++;
                        whichCollectionCard = rs.Filename[5]
                    }
                    else if (card < (cardP1234567) && card > (cardP123456)) {
                        CardIdAmounts.card7++;
                        whichCollectionCard = rs.Filename[6]
                    }
                    else if (card < (cardP12345678) && card > (cardP1234567)) {
                        CardIdAmounts.card8++;
                        whichCollectionCard = rs.Filename[7]
                    }
                    else if (card < 1 && card > (cardP12345678)) {
                        CardIdAmounts.card9++;
                        whichCollectionCard = rs.Filename[8]
                    }
                    break;
                }
            case 10:
                {
                    let cardProbability5 = parseFloat(CardProbability.cardProbability5)
                    let cardProbability6 = parseFloat(CardProbability.cardProbability6)
                    let cardProbability7 = parseFloat(CardProbability.cardProbability7)
                    let cardProbability8 = parseFloat(CardProbability.cardProbability8)
                    let cardProbability9 = parseFloat(CardProbability.cardProbability9)
                    let cardP12345 = cardP1234 + cardProbability5
                    let cardP123456 = cardP12345 + cardProbability6
                    let cardP1234567 = cardP123456 + cardProbability7
                    let cardP12345678 = cardP1234567 + cardProbability8
                    let cardP123456789 = cardP12345678 + cardProbability9
                    if (card < cardProbability1 && card >= 0) {
                        CardIdAmounts.card1++;
                        whichCollectionCard = rs.Filename[0]
                    }
                    else if (card < (cardP12) && card >= cardProbability1) {
                        CardIdAmounts.card2++;
                        whichCollectionCard = rs.Filename[1]
                    }
                    else if (card < (cardP123) && card > (cardP12)) {
                        CardIdAmounts.card3++;
                        whichCollectionCard = rs.Filename[2]
                    }
                    else if (card < (cardP1234) && card > (cardP123)) {
                        CardIdAmounts.card4++;
                        whichCollectionCard = rs.Filename[3]
                    }
                    else if (card < (cardP12345) && card > (cardP1234)) {
                        CardIdAmounts.card5++;
                        whichCollectionCard = rs.Filename[4]
                    }
                    else if (card < (cardP123456) && card > (cardP12345)) {
                        CardIdAmounts.card6++;
                        whichCollectionCard = rs.Filename[5]
                    }
                    else if (card < (cardP1234567) && card > (cardP123456)) {
                        CardIdAmounts.card7++;
                        whichCollectionCard = rs.Filename[6]
                    }
                    else if (card < (cardP12345678) && card > (cardP1234567)) {
                        CardIdAmounts.card8++;
                        whichCollectionCard = rs.Filename[7]
                    }
                    else if (card < (cardP123456789) && card > (cardP12345678)) {
                        CardIdAmounts.card9++;
                        whichCollectionCard = rs.Filename[8]
                    }
                    else if (card < 1 && card > (cardP123456789)) {
                        CardIdAmounts.card10++;
                        whichCollectionCard = rs.Filename[9]
                    }
                    break;
                }

        }
        //CollectionPassUserId�Ұ��˭�ռ�����
        //CollectionGetUserId˭������ռ�����
        let CollectionGetUserId: any = Col.CollectionGetUserId;
        let userinfo: any = await getModel("users.users").findOne({ where: { uuid: UserCollectionCards.Useruuid } });
        //�ռ���¼
        let timehelp = new Date().getTime()
        let headurl = userinfo.headurl
        let username = userinfo.nickname
        let whichCollectioncard:any = whichCollectionCard
        let UserCollection = Col.UserCollection
        let collectionchip = { whichCollectioncard, timehelp, headurl, username }
        //��Ա�����UserId¼��
        if (!CollectionGetUserId) {
            CollectionGetUserId = []
            CollectionGetUserId.push(UserCollectionCards.Useruuid)
            let UserCollections = JSON.stringify(collectionchip)
            let UserCollectionss = []
          
            UserCollectionss.push(UserCollections)
            //  let CardIdAmountss=JSON.stringify(CardIdAmounts)
            // let CollectionGetUserIds=JSON.stringify(CollectionGetUserId)
            await getModel(modelName).update({ CardIdAmounts, CardAmount, CollectionGetUserId, UserCollection: UserCollectionss },
                { where: { Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
                  
        } else {
            //�ж��Ƿ�������ռ��
            
            if (rs.CardIdAmounts === 5 && CardIdAmounts.card1 >= 1
                && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1) {
                await getModel(modelName).update({CollectionState:2},
                    { where: {Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
            } else if (rs.CardIdAmounts === 6 && CardIdAmounts.card1 >= 1
                && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                && CardIdAmounts.card6 >= 1) {
                await getModel(modelName).update({CollectionState:2},
                    { where: {Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
            } else if (rs.CardIdAmounts === 7 && CardIdAmounts.card1 >= 1
                && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1) {
                await getModel(modelName).update({CollectionState:2},
                    { where: {Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
            } else if (rs.CardIdAmounts === 8 && CardIdAmounts.card1 >= 1
                && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1
                && CardIdAmounts.card8 >= 1) {
                await getModel(modelName).update({CollectionState:2},
                    { where: {Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
            } else if (rs.CardIdAmounts === 9 && CardIdAmounts.card1 >= 1
                && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1
                && CardIdAmounts.card8 >= 1 && CardIdAmounts.card9 >= 1) {
                await getModel(modelName).update({CollectionState:2},
                    { where: {Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
            } else if (rs.CardIdAmounts=== 10 && CardIdAmounts.card1 >= 1
                && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1
                && CardIdAmounts.card8 >= 1 && CardIdAmounts.card9 >= 1 && CardIdAmounts.card10 >= 1) {
                    await getModel(modelName).update({CollectionState:2},
                        { where: { Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid} });
            }
            CollectionGetUserId.push(UserCollectionCards.Useruuid)
            let UserCollections = JSON.stringify(collectionchip)
            UserCollection.push(UserCollections)
            await getModel(modelName)
                .update({ CardIdAmounts: CardIdAmounts, CardAmount: CardAmount, CollectionGetUserId: CollectionGetUserId, UserCollection: UserCollection },
                { where: { Useruuid: UserCollectionCards.UserId, Activityuuid: UserCollectionCards.Activityuuid } });
        }
        //��԰�æ��¼��
        let HCol: any = await getModel(modelName)
            .findOne({ where: { Useruuid: UserCollectionCards.Useruuid, Activityuuid: UserCollectionCards.Activityuuid } });
        let CollectionPassUserId = HCol.CollectionPassUserId
        if (!CollectionPassUserId) {
            let CollectionPassUserId = []
            let uuida = UserCollectionCards.UserId
            CollectionPassUserId.push(uuida)
            await getModel(modelName)
                .update({ CollectionPassUserId },
                { where: { Useruuid: UserCollectionCards.Useruuid, Activityuuid: UserCollectionCards.Activityuuid } });
        } else {
            CollectionPassUserId.push(UserCollectionCards.UserId)
            await getModel(modelName)
                .update({ CollectionPassUserId },
                { where: { Useruuid: UserCollectionCards.Useruuid, Activityuuid: UserCollectionCards.Activityuuid } });
        }

    } catch (e) {
        throw new Error(e)
    }
}
//�ռ���Ƭ
export async function UserCollectionchipHelp(UserCollectionchipHelps: any) {
    try {
        console.log(UserCollectionchipHelps)
        //��ѯ��������Ϣ
        let Col: any = await getModel(modelName)
            .findOne({ where: { Useruuid: UserCollectionchipHelps.UserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
        // let CollectionPassUserId = Col.CollectionPassUserId
        let CollectionGetUserId=Col.CollectionGetUserId
        //�ж��Ƿ���ڰ������ռ�����û���Ϣ
        if (CollectionGetUserId) {
            // CollectionPassUserId.forEach(async (PassUserId: string) => {
                CollectionGetUserId.forEach(async (PassUserId: string) => {
                let Coll: any = await getModel(modelName)
                    .findOne({ where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                if(Coll){
                let ChipIdAmounts = Coll.ChipIdAmounts
                let CardIdAmounts = Coll.CardIdAmounts
                let CardAmount=Coll.CardAmount
                let rs: any = await getModel("mall.collectioncreate").findOne({ where: {uuid: UserCollectionchipHelps.Activityuuid } });
                let chipProbability = rs.ChipProbability
                //cardΪ�ÿ��Ƶ���Ƭ0-1�������
                let card = Math.random();
                let chipProbability1 = chipProbability.chipProbability1
                let chipProbability2 = chipProbability.chipProbability2
                let chipProbability3 = chipProbability.chipProbability3
                let chipProbability4 = chipProbability.chipProbability4
                //�ж���Ƭ�Ƿ����γɿ���
                let ChipIds = rs.ChipIdAmounts
                let cardAllOk = rs.CardIdAmounts
                let whichCollectionCard:String;
                //���ݲ�ͬ�Ŀ��ƹ����Ƶ�json��ʼֵ
                switch (cardAllOk) {
                    case 5: {
                        if (card < chipProbability1 && card >= 0) {
                            //��æ�ռ��������
                            ChipIdAmounts.chip1++
                            if (ChipIdAmounts.chip1 === ChipIds) {
                                ChipIdAmounts.chip1 = 0;
                                CardIdAmounts.card1++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[0] 
                        }
                        else if (card < (chipProbability2 + chipProbability1) && card >= chipProbability1) {
                            ChipIdAmounts.chip2++
                            if (ChipIdAmounts.chip2 === ChipIds) {
                                ChipIdAmounts.chip2 = 0;
                                CardIdAmounts.card2++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[1]
                        }
                        else if (card < (chipProbability2 + chipProbability1 + chipProbability3) && card > (chipProbability1 + chipProbability2)) {
                            ChipIdAmounts.chip3++
                            if (ChipIdAmounts.chip3 === ChipIds) {
                                ChipIdAmounts.chip3 = 0;
                                CardIdAmounts.card3++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[2]
                        }
                        else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4) && card > (chipProbability2 + chipProbability1 + chipProbability3)) {
                            ChipIdAmounts.chip4++
                            if (ChipIdAmounts.chip4 === ChipIds) {
                                ChipIdAmounts.chip4 = 0;
                                CardIdAmounts.card4++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[3]
                        }
                        else if (card < 1 && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4)) {
                            ChipIdAmounts.chip5++
                            if (ChipIdAmounts.chip5 === ChipIds) {
                                ChipIdAmounts.chip5 = 0;
                                CardIdAmounts.card5++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[4]
                        }
                        break;
                    }
                    case 6: {
                        let chipProbability5 = chipProbability.chipProbability5
                        if (card < chipProbability1 && card >= 0) {
                            ChipIdAmounts.chip1++
                            if (ChipIdAmounts.chip1 === ChipIds) {
                                ChipIdAmounts.chip1 = 0;
                                CardIdAmounts.card1++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[0]
                        }
                        else if (card < (chipProbability2 + chipProbability1) && card >= chipProbability1) {
                            ChipIdAmounts.chip2++
                            if (ChipIdAmounts.chip2 === ChipIds) {
                                ChipIdAmounts.chip2 = 0;
                                CardIdAmounts.card2++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[1]
                        }
                        else if (card < (chipProbability2 + chipProbability1 + chipProbability3) && card > (chipProbability1 + chipProbability2)) {
                            ChipIdAmounts.chip3++
                            if (ChipIdAmounts.chip3 === ChipIds) {
                                ChipIdAmounts.chip3 = 0;
                                CardIdAmounts.card3++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[2]
                        }
                        else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4) && card > (chipProbability2 + chipProbability1 + chipProbability3)) {
                            ChipIdAmounts.chip4++
                            if (ChipIdAmounts.chip4 === ChipIds) {
                                ChipIdAmounts.chip4 = 0;
                                CardIdAmounts.card4++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[3]
                        }
                        else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4)) {
                            ChipIdAmounts.chip5++
                            if (ChipIdAmounts.chip5 === ChipIds) {
                                ChipIdAmounts.chip5 = 0;
                                CardIdAmounts.card5++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[4]
                        }
                        else if (card < 1 && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5)) {
                            ChipIdAmounts.chip6++
                            if (ChipIdAmounts.chip6 === ChipIds) {
                                ChipIdAmounts.chip6 = 0;
                                CardIdAmounts.card6++;
                                CardAmount++;
                            }
                            whichCollectionCard = rs.Filename[5]
                        }
                        break;
                    }
                    case 7:
                        {
                            let cardProbability5 = chipProbability.chipProbability5
                            let cardProbability6 = chipProbability.chipProbability6
                            if (card < chipProbability1 && card >= 0) {
                                ChipIdAmounts.chip1++
                                if (ChipIdAmounts.chip1 === ChipIds) {
                                    ChipIdAmounts.chip1 = 0;
                                    CardIdAmounts.card1++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[0]

                            }
                            else if (card < (chipProbability2 + chipProbability1) && card >= chipProbability1) {
                                ChipIdAmounts.chip2++
                                if (ChipIdAmounts.chip2 === ChipIds) {
                                    ChipIdAmounts.chip2 = 0;
                                    CardIdAmounts.card2++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[1]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3) && card > (chipProbability1 + chipProbability2)) {
                                ChipIdAmounts.chip3++
                                if (ChipIdAmounts.chip3 === ChipIds) {
                                    ChipIdAmounts.chip3 = 0;
                                    CardIdAmounts.card3++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[2]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4) && card > (chipProbability2 + chipProbability1 + chipProbability3)) {
                                ChipIdAmounts.chip4++
                                if (ChipIdAmounts.chip4 === ChipIds) {
                                    ChipIdAmounts.chip4 = 0;
                                    CardIdAmounts.card4++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[3]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + cardProbability5) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4)) {
                                ChipIdAmounts.chip5++
                                if (ChipIdAmounts.chip5 === ChipIds) {
                                    ChipIdAmounts.chip5 = 0;
                                    CardIdAmounts.card5++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[4]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + cardProbability5 + cardProbability6) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + cardProbability5)) {
                                ChipIdAmounts.chip6++
                                if (ChipIdAmounts.chip6 === ChipIds) {
                                    ChipIdAmounts.chip6 = 0;
                                    CardIdAmounts.card6++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[5]

                            }
                            else if (card < 1 && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + cardProbability5 + cardProbability6)) {
                                ChipIdAmounts.chip7++
                                if (ChipIdAmounts.chip7 === ChipIds) {
                                    ChipIdAmounts.chip7 = 0;
                                    CardIdAmounts.card7++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[6]

                            }
                            break;
                        }
                    case 8:
                        {
                            let chipProbability5 = chipProbability.chipProbability5
                            let chipProbability6 = chipProbability.chipProbability6
                            let chipProbability7 = chipProbability.chipProbability7
                            if (card < chipProbability1 && card >= 0) {

                                ChipIdAmounts.chip1++
                                if (ChipIdAmounts.chip1 === ChipIds) {
                                    ChipIdAmounts.chip1 = 0;
                                    CardIdAmounts.card1++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[0]

                            }
                            else if (card < (chipProbability2 + chipProbability1) && card >= chipProbability1) {
                                ChipIdAmounts.chip2++
                                if (ChipIdAmounts.chip2 === ChipIds) {
                                    ChipIdAmounts.chip2 = 0;
                                    CardIdAmounts.card2++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[1]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3) && card > (chipProbability1 + chipProbability2)) {
                                ChipIdAmounts.chip3++
                                if (ChipIdAmounts.chip3 === ChipIds) {
                                    ChipIdAmounts.chip3 = 0;
                                    CardIdAmounts.card3++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[2]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4) && card > (chipProbability2 + chipProbability1 + chipProbability3)) {
                                ChipIdAmounts.chip4++
                                if (ChipIdAmounts.chip4 === ChipIds) {
                                    ChipIdAmounts.chip4 = 0;
                                    CardIdAmounts.card4++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[3]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4)) {
                                ChipIdAmounts.chip5++
                                if (ChipIdAmounts.chip5 === ChipIds) {
                                    ChipIdAmounts.chip5 = 0;
                                    CardIdAmounts.card5++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[4]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5)) {
                                ChipIdAmounts.chip6++
                                if (ChipIdAmounts.chip6 === ChipIds) {
                                    ChipIdAmounts.chip6 = 0;
                                    CardIdAmounts.card6++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[5]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6)) {
                                ChipIdAmounts.chip7++
                                if (ChipIdAmounts.chip7 === ChipIds) {
                                    ChipIdAmounts.chip7 = 0;
                                    CardIdAmounts.card7++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[6]

                            }
                            else if (card < 1 && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7)) {
                                ChipIdAmounts.chip8++
                                if (ChipIdAmounts.chip8 === ChipIds) {
                                    ChipIdAmounts.chip8 = 0;
                                    CardIdAmounts.card8++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[7]

                            }
                            break;
                        }
                    case 9:
                        {
                            let chipProbability5 = chipProbability.chipProbability5
                            let chipProbability6 = chipProbability.chipProbability6
                            let chipProbability7 = chipProbability.chipProbability7
                            let chipProbability8 = chipProbability.chipProbability8
                            if (card < chipProbability1 && card >= 0) {
                                ChipIdAmounts.chip1++
                                if (ChipIdAmounts.chip1 === ChipIds) {
                                    ChipIdAmounts.chip1 = 0;
                                    CardIdAmounts.card1++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[0]

                            }
                            else if (card < (chipProbability2 + chipProbability1) && card >= chipProbability1) {
                                ChipIdAmounts.chip2++
                                if (ChipIdAmounts.chip2 === ChipIds) {
                                    ChipIdAmounts.chip2 = 0;
                                    CardIdAmounts.card2++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[1]

                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3) && card > (chipProbability1 + chipProbability2)) {
                                ChipIdAmounts.chip3++
                                if (ChipIdAmounts.chip3 === ChipIds) {
                                    ChipIdAmounts.chip3 = 0;
                                    CardIdAmounts.card3++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[2]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4) && card > (chipProbability2 + chipProbability1 + chipProbability3)) {
                                ChipIdAmounts.chip4++
                                if (ChipIdAmounts.chip4 === ChipIds) {
                                    ChipIdAmounts.chip4 = 0;
                                    CardIdAmounts.card4++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[3]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4)) {
                                ChipIdAmounts.chip5++
                                if (ChipIdAmounts.chip5 === ChipIds) {
                                    ChipIdAmounts.chip5 = 0;
                                    CardIdAmounts.card5++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[4]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5)) {
                                ChipIdAmounts.chip6++
                                if (ChipIdAmounts.chip6 === ChipIds) {
                                    ChipIdAmounts.chip6 = 0;
                                    CardIdAmounts.card6++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[5]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6)) {
                                ChipIdAmounts.chip7++
                                if (ChipIdAmounts.chip7 === ChipIds) {
                                    ChipIdAmounts.chip7 = 0;
                                    CardIdAmounts.card7++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[6]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7 + chipProbability8) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7)) {
                                ChipIdAmounts.chip8++
                                if (ChipIdAmounts.chip8 === ChipIds) {
                                    ChipIdAmounts.chip8 = 0;
                                    CardIdAmounts.card8++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[7]
                            }
                            else if (card < 1 && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7 + chipProbability8)) {
                                ChipIdAmounts.chip9++
                                if (ChipIdAmounts.chip9 === ChipIds) {
                                    ChipIdAmounts.chip9 = 0;
                                    CardIdAmounts.card9++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[8]
                            }
                            break;
                        }
                    case 10:
                        {
                            let chipProbability5 = chipProbability.chipProbability5
                            let chipProbability6 = chipProbability.chipProbability6
                            let chipProbability7 = chipProbability.chipProbability7
                            let chipProbability8 = chipProbability.chipProbability8
                            let chipProbability9 = chipProbability.chipProbability9
                            if (card < chipProbability1 && card >= 0) {
                                ChipIdAmounts.chip1++
                                if (ChipIdAmounts.chip1 === ChipIds) {
                                    ChipIdAmounts.chip1 = 0;
                                    CardIdAmounts.card1++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[0]
                            }
                            else if (card < (chipProbability2 + chipProbability1) && card >= chipProbability1) {
                                ChipIdAmounts.chip2++
                                if (ChipIdAmounts.chip2 === ChipIds) {
                                    ChipIdAmounts.chip2 = 0;
                                    CardIdAmounts.card2++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[1]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3) && card > (chipProbability1 + chipProbability2)) {
                                ChipIdAmounts = ChipIdAmounts.chip3++
                                if (ChipIdAmounts.chip3 === ChipIds) {
                                    ChipIdAmounts.chip3 = 0;
                                    CardIdAmounts.card3++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[2]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4) && card > (chipProbability2 + chipProbability1 + chipProbability3)) {
                                ChipIdAmounts.chip4++
                                if (ChipIdAmounts.chip4 === ChipIds) {
                                    ChipIdAmounts.chip4 = 0;
                                    CardIdAmounts.card4++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[3]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4)) {
                                ChipIdAmounts.chip5++
                                if (ChipIdAmounts.chip5 === ChipIds) {
                                    ChipIdAmounts.chip5 = 0;
                                    CardIdAmounts.card5++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[4]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5)) {
                                ChipIdAmounts.chip6++
                                if (ChipIdAmounts.chip6 === ChipIds) {
                                    ChipIdAmounts.chip6 = 0;
                                    CardIdAmounts.card6++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[5]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6)) {
                                ChipIdAmounts.chip7++
                                if (ChipIdAmounts.chip7 === ChipIds) {
                                    ChipIdAmounts.chip7 = 0;
                                    CardIdAmounts.card7++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[6]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7 + chipProbability8) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7)) {
                                ChipIdAmounts.chip8++
                                if (ChipIdAmounts.chip8 === ChipIds) {
                                    ChipIdAmounts.chip8 = 0;
                                    CardIdAmounts.card8++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[7]
                            }
                            else if (card < (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7 + chipProbability8 + chipProbability9) && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7 + chipProbability8)) {
                                ChipIdAmounts.chip9++
                                if (ChipIdAmounts.chip9 === ChipIds) {
                                    ChipIdAmounts.chip9 = 0;
                                    CardIdAmounts.card9++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[8]
                            }
                            else if (card < 1 && card > (chipProbability2 + chipProbability1 + chipProbability3 + chipProbability4 + chipProbability5 + chipProbability6 + chipProbability7 + chipProbability8 + chipProbability9)) {
                                ChipIdAmounts.chip10++

                                if (ChipIdAmounts.chip10 === ChipIds) {
                                    ChipIdAmounts.chip10 = 0;
                                    CardIdAmounts.card10++;
                                    CardAmount++;
                                }
                                whichCollectionCard = rs.Filename[9]
                            }
                            break;
                        }
                }
              
                let userinfo: any = await getModel("users.users").findOne({ where: { uuid: UserCollectionchipHelps.Useruuid } });
                let timehelp = new Date().getTime()
                 let headurl = userinfo.headurl
                 let username = userinfo.nickname
                let whichCollectionCardchip = whichCollectionCard + "-��Ƭ"
                let UserCollection = Coll.UserCollection
                let collectionchip = { whichCollectioncard:whichCollectionCardchip, timehelp, headurl, username }
                let collectionchips = JSON.stringify(collectionchip)
                if(!UserCollection){
                    UserCollection=[]
                }
                UserCollection.push(collectionchips)
                //�����ռ���Ƭ���������û�id
                let res: any = await getModel(modelName).update({ CardIdAmounts, ChipIdAmounts, UserCollection: UserCollection ,CardAmount},
                    { where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                      //�ж��Ƿ�������ռ��
                if (chipProbability.length === 5 && CardIdAmounts.card1 >= 1
                    && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                    && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1) {
                    await getModel(modelName).update({CollectionState:2},
                        { where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                } else if (chipProbability.length === 6 && CardIdAmounts.card1 >= 1
                    && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                    && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                    && CardIdAmounts.card6 >= 1) {
                    await getModel(modelName).update({CollectionState:2},
                        { where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                } else if (chipProbability.length === 7 && CardIdAmounts.card1 >= 1
                    && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                    && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                    && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1) {
                    await getModel(modelName).update({CollectionState:2},
                        { where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                } else if (chipProbability.length === 8 && CardIdAmounts.card1 >= 1
                    && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                    && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                    && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1
                    && CardIdAmounts.card8 >= 1) {
                    await getModel(modelName).update({CollectionState:2},
                        { where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                } else if (chipProbability.length === 9 && CardIdAmounts.card1 >= 1
                    && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                    && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                    && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1
                    && CardIdAmounts.card8 >= 1 && CardIdAmounts.card9 >= 1) {
                    await getModel(modelName).update({CollectionState:2},
                        { where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                } else if (chipProbability.length === 10 && CardIdAmounts.card1 >= 1
                    && CardIdAmounts.card2 >= 1 && CardIdAmounts.card3 >= 1
                    && CardIdAmounts.card4 >= 1 && CardIdAmounts.card5 >= 1
                    && CardIdAmounts.card6 >= 1 && CardIdAmounts.card7 >= 1
                    && CardIdAmounts.card8 >= 1 && CardIdAmounts.card9 >= 1 && CardIdAmounts.card10 >= 1) {
                        await getModel(modelName).update({CollectionState:2},
                            { where: { Useruuid: PassUserId, Activityuuid: UserCollectionchipHelps.Activityuuid } });
                }
                
                return res ? res.get() : undefined
                }
            })
            
        }
    } catch (e) {
        console.log(1111111)
        throw new Error(e)
    }
}
//�鿴�û������
export async function find_UserInfo_Activity(Activityuuid: any, Useruuid: any) {
    let res: any = await getModel(modelName).findOne({ where: { Activityuuid: Activityuuid, Useruuid: Useruuid } })
    // res = res.get()
    let UserCollection = res.UserCollection
    if (UserCollection) {
        for (let i = 0; i < UserCollection.length; i++) {
            UserCollection[i] = JSON.parse(UserCollection[i])
        }
    }
    let RES = { res, UserCollection }
    return RES
}
//�鿴ĳ���
export async function find_Info_Activity(Activityuuid: any) {
    let res = await getModel("mall.collectioncreate").findOne({ where: { uuid: Activityuuid } })
    return res
}
//���Ҳ鿴���еĻ
export async function find_AllUser_Activity() {
    let res = await getModel(modelName).findAll() as any[]
    return res ? res.map(r => r.get()) : undefined
}
//�鿴�û��������
export async function findUserBirthday(uuid: any) {
    let res: any = await getModel("users.users").findOne({ where: { uuid: uuid } });
    let birthday = res.birthday
    return birthday
}
//�鿴��������
export async function findfortune(uuid: any) {
    let res: any = await getModel("mall.collectionaward").findOne({ where: { uuid: uuid } });
    return res
}
//�鿴����
export async function findisNoFor(Activityuuid: any) {
    let res: any = await getModel("mall.collectioncreate").findOne({ where: { uuid: Activityuuid } });
    let isNoFortune = res.isNoFortune
    return isNoFortune
}

//��ȡ����
export async function getreward(uuid:any,Activityuuid: any,rewardtimestamp:any) {
    await getModel(modelName).update({CollectionState:3,rewardtimestamp}, { where: { Useruuid:uuid,Activityuuid}, returning: true })
    
}
export async function findByState(uuid: string) {
    let res = await getModel(modelName).findOne({ where: { uuid: uuid, state: 'onsale', deleted: 0 } })
    return res ? res.get() : undefined
}
/**
 * �޸Ľ�Ʒ״̬��Ϣ
 * @param uuid
 */
export async function updateUserprizeState(uuid: string) {
    let [number, res] = await getModel(modelName).update({ state: 'true' }, { where: { uuid: uuid }, returning: true })
    return number > 0 ? res[0].get() : undefined
}
export async function find_UserInfoLog(Activityuuid:any){
   let res= await getModel(modelName).findAll({ where: {Activityuuid} })
   return res 
}
export async function find_User(Useruuid:any){
    let res = await getModel("users.users").findOne({ where: { uuid:Useruuid } })
    return res ? res.get() : undefined
}
//�û�������uuid
export async function find_uuid(Useruuid:any){
    let res = await getModel("users.users").findOne({ where: { uuid:Useruuid } })
    return res ? res.get() : undefined
}
//��ѯ����
export async function findColInfo1(obj1: any, cursor: number, limit: number) {
    let res = await getModel(modelName).findAll({ where: obj1, order: [['createTime', "DESC"]], offset: cursor, limit: limit }) as any[]
    return res.map(r => r.get())
}
//�û�����uuid
export async function findColInfo(username:any) {
    let res = await getModel(modelName).findOne({ where:{username} })
    return res ? res.get() : undefined
}
//ģ����ѯ
export async function getCount1(Activityuuid:any,CollectionState:any) {
    let res = await getModel(modelName).findAll({where: {Activityuuid,CollectionState }})
    return res
}
