import { SrvRecord } from 'dns';
import { Context, Schema,Random, renameProperty } from 'koishi'

export const name = 'dicey-dungeons'

const random = new Random(() => Math.random());


const Introduction = {
  "剑": {descriptions:"造成□伤害",austerity:3,dice:'',quantities:1,Category:['造成']},
  "匕首": {descriptions:"[1-3]造成□伤害",austerity:1,dice:'1-3',quantities:9,Category:['造成']},
  "回旋镖": {descriptions:"造成□*2伤害,自身受到□伤害",austerity:3,quantities:1,Category:['造成','自身']},
  "火球": {descriptions:"[偶数]造成□伤害,燃烧1个骰子",austerity:2,dice:'偶数',quantities:1,Category:['造成','燃烧']},
  "雪球": {descriptions:"[奇数]造成□伤害,冰冻1个骰子",austerity:2,dice:'奇数',quantities:1,Category:['造成','冰冻']},
  "诅咒": {descriptions:"[1]造成□+1伤害，施加1层诅咒",austerity:0,dice:1,quantities:1,Category:['造成','诅咒']},
  "毒药咒语": {descriptions:"[3]施加4层中毒",austerity:0,dice:3,quantities:1,Category:['诅咒']},
  "治愈水晶": {descriptions:"[1-3]回复□生命值",austerity:1,dice:'1-3',quantities:1,Category:['回复']},
  "木质盾牌": {descriptions:"[1-4]获得□点护盾",austerity:1,dice:'1-3',quantities:1,Category:['护盾']},
  "复制": {descriptions:"[4-6]复制1个骰子",austerity:1,dice:'4-6',quantities:1,Category:['复制']},
  "铲": {descriptions:"颠倒1个骰子",austerity:3,dice:'',quantities:1,Category:['颠倒']},
  "绝佳手气": {descriptions:"[1-5]重投1个点数更大的骰子",austerity:1,dice:'1-5',quantities:1,Category:['重投更大']},
  "战斗翻滚": {descriptions:"重投1个骰子(3次)",austerity:3,dice:'',quantities:3,Category:['重投']}
};

export interface Config {}

declare module 'koishi' {
  interface Tables {
      dice_group: group;
      dice_player: player;
  }
}

// 预更对战
export interface group{
  id: number;
  guildId: string; // 群聊id
  Play_1_userId: string; // 玩家1ID
  Play_2_userId: string; // 玩家2ID
  bout : string; // 回合
  game_status :number; // 游戏状态 2代表游戏开始 1代表游戏准备，0代表暂未开始
}

export interface player{
  id: number;
  userId :string ; // 玩家1id
  HP: number; // 玩家血量
  dice : string[]; // [⚀,⚁,⚂,⚃,⚄,⚅]
  skills: string[]; //技能列表[]
  skill: object; // 技能{}
  counterparties:string;
  burn:number;  //燃烧
  freeze:number; //冰冻
  poison:number; // 中毒
  curse:number; // 诅咒
  shield:number // 护盾
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.model.extend('dice_player', {
    id: 'unsigned',
    userId: 'string',
    HP :'unsigned',
    dice:'list',
    skills:'list',
    skill:'json',
    burn:'unsigned',
    freeze:'unsigned',
    poison:'unsigned',
    curse:'unsigned',
    shield:'unsigned',
    counterparties:'string'
    }, {
    autoInc: true,
});
ctx.model.extend('dice_group', {
  id: 'unsigned',
  guildId: 'string',
  Play_1_userId: 'string',
  Play_2_userId: 'string',
  bout : 'string',
  game_status :'unsigned',
}, {
  autoInc: true,
});
  ctx.command('骰子地下城')
    .action(async ({ session }) => {
      const { userId,guildId } = session;
      return `══骰子地下城══\n加入对战 创建对战\n对战信息 销毁对战\n结束对战 结束回合状态说明\n游戏介绍 关于作者\nTips:对战建议一个群聊一个对战`
    })

  ctx.command('骰子地下城')
  .subcommand('游戏介绍')
  .action( async ({session})=>{
    return `══骰子地下城══\n
⚀双人回合制对战\n
⚁每人获得5件装备和4个骰子\n
⚂骰子和装备次数每回合刷新\n
⚃有的装备使用会有限制点数\n
⚄【结束回合】结束当前回合\n
⚅【骰子点数(空格)装备序号】使用对应骰子和装备
`
  })
  ctx.command('骰子地下城')
  .subcommand('状态说明')
  .action( async ({session})=>{
    return `══骰子地下城══\n
状态说明
状态:\n
⚀燃烧:按燃烧层数，燃烧骰子，即不可使用\n
⚁冰冻:按顺序冰冻骰子，点数变成1\n
⚂诅咒:骰子有50％概率失效\n
⚃中毒:每回合层数-1并造成伤害\n
⚄护盾:抵挡护盾层数的直接伤害`
  })
  ctx.command('骰子地下城')
    .subcommand('关于游戏')
    .action(async ({session}) =>{
      return `══骰子地下城══\n游戏灵感来自：Dicey Dungeons\n原作者：BridgeBuilder-2413933494\n移植作者：1594817572\nPS：此游戏是从QRSpeed机器人框架的词库移植到koishi`
    })
  ctx.command('骰子地下城')
    .subcommand('创建对战')
    .action(async ({session}) =>{
      const {userId,guildId} = session;
      const game_status = ['开始','游戏准备','结束'];
      const read = await ctx.database.get('dice_group',{guildId})
      if( read?.[0]?.game_status == 0 ||!read?.[0]?.game_status){
        await ctx.database.create('dice_group',{guildId,Play_1_userId:userId,game_status:1})
        return `══骰子地下城══\n游戏准备中\n玩家1：${userId}\n玩家2:暂缺\nTips：发送‘加入游戏’即可加入`
      }else{
        return `══骰子地下城══\n游戏已经${game_status[read?.[0]?.game_status]}\n请等待`
      }
    })
  ctx.command('骰子地下城')
    .subcommand('加入对战')
    .action(async ({session}) =>{
      const {userId,guildId} = session;
      const game_status = ['游戏结束','游戏准备','游戏开始'];
      const read = await ctx.database.get('dice_group',{guildId});
      if( read?.[0]?.game_status == 1 && userId != read?.[0]?.Play_1_userId){
        await ctx.database.set('dice_group',{guildId},{Play_2_userId:userId,game_status:2})
        return `══骰子地下城══\n玩家1：${read?.[0]?.Play_1_userId}\n玩家2：${userId}\n请由玩家1开启对战\n->指令：开始对战`
      }else{
        return `══骰子地下城══\n${game_status[read?.[0]?.game_status]}\n请等待`
      }
    })
  ctx.command('骰子地下城')
    .subcommand('重置对战')
    .action(async ({session})=>{
      const {userId,guildId} = session;
      await ctx.database.remove('dice_group',{guildId})
      await ctx.database.remove('dice_player',{userId})
      return `══骰子地下城══\n->重置对战成功`
    })
  ctx.command('骰子地下城')
    .subcommand('结束回合')
    .action(async ({session})=>{
      const {userId,guildId} = session;
      const dice_group = await ctx.database.get('dice_group',{guildId});
      const dice_player_1 = await ctx.database.get('dice_player',{userId:dice_group?.[0]?.Play_1_userId});
      const dice_player_2 = await ctx.database.get('dice_player',{userId:dice_group?.[0]?.Play_2_userId});
      if(dice_group?.[0]?.game_status != 2){
        return `游戏还没开始`
      }else if (dice_group?.[0]?.bout != userId){
        return '还没有轮到你的回合'
      }else if(dice_player_1?.[0]?.HP <= 0){
        return await 血量判定(ctx,dice_group?.[0]?.Play_1_userId,guildId)
      }else if(dice_player_2?.[0]?.HP <= 0){
        return await 血量判定(ctx,dice_group?.[0]?.Play_2_userId,guildId)
      }else{
        // $写 骰子地下城/%群号%/设置 轮到 [3-%t%]$
        // $回调 重置玩家[3-%t%]次数$
        // $回调 生成玩家[3-%t%]骰子$
        // $写 骰子地下城/%群号%/玩家%t% 状态诅咒 0$
        // \n装备和骰子已刷新
        // $调用 1000 玩家信息$
      }
    })
  ctx.command('骰子地下城')
    .subcommand('开始对战')
    .action(async ({session})=>{
      const {userId,guildId} = session;
      const dice_group = await ctx.database.get('dice_group',{guildId});
      const dice_player = await ctx.database.get('dice_player',{userId});
      if( dice_group?.[0]?.game_status == 2 ){
        const random = new Random(() => Math.random());
        const bout = random.pick([dice_group?.[0]?.Play_1_userId,dice_group?.[0]?.Play_2_userId]);
        await Generating_equipment(ctx,dice_group[0].Play_1_userId);
        await Generating_equipment(ctx,dice_group[0].Play_2_userId);
        await ctx.database.set('dice_group',{guildId},{bout});
        await ctx.database.set('dice_player',{userId:dice_group?.[0]?.Play_1_userId},{counterparties:dice_group?.[0]?.Play_2_userId});
        await ctx.database.set('dice_player',{userId:dice_group?.[0]?.Play_2_userId},{counterparties:dice_group?.[0]?.Play_1_userId});
        return `══骰子地下城══\n➢${dice_group?.[0]?.Play_1_userId}\nPK➣${dice_group?.[0]?.Play_2_userId}\n${bout}\n先手进攻\n输入【对战信息】查看装备`
      }else{
        return `══骰子地下城══\n游戏暂未开始\n请开始游戏`
      }
    })
  ctx.command('骰子地下城')
    .subcommand('对战信息')
    .action( async ({session})=>{
      const {userId,guildId} = session;
      const dice_group = await ctx.database.get('dice_group',{guildId});
      const dice_player = await ctx.database.get('dice_player',{userId});
      return `══骰子地下城══\n当前回合：${dice_group?.[0]?.bout}\n➢玩家：${userId}\n血量：${HP(dice_player?.[0]?.HP,50)}\n${Show_equipment(dice_player?.[0]?.skills)}骰子：${Show_Dice(dice_player?.[0]?.dice)}\n状态：${await Display_Status(ctx,userId)}`
    })
  ctx.command('骰子地下城')
    .subcommand('点数 <dice> <props>')
    .action(async ({session},dice,props) =>{
      const {userId,guildId} = session;
      const dice_group = await ctx.database.get('dice_group',{guildId});
      const dice_player = await ctx.database.get('dice_player',{userId});
      const random = new Random(() => Math.random());
      const prop = dice_player?.[0]?.skills[Number(props)-1];
      if(dice_group?.[0]?.game_status != 2){
        return `══骰子地下城══\n还没开始对战呢`
      }else if(dice_group?.[0]?.bout != userId ){
        return `══骰子地下城══\n还不是你的回合哦`
      }else if( Number(dice_player?.[0]?.skill?.[Number(props) - 1]) >= 0){ // 判断装备是否小于等于0
        return `══骰子地下城══\n这个装备次数已用完`
      }else if( !dice_player?.[0]?.dice.includes(dice) ){
        return `══骰子地下城══\n你没有这个骰子`
      }else if( dice_player?.[0]?.dice.length == 0){
        return `══骰子地下城══\n你没有骰子了，输入【结束回合】`
      }else if(await Dice_Decision(Introduction[prop].austerity,dice,Introduction[prop].dice) == false){
        return `══骰子地下城══\n骰子不符合装备，无法使用`
      }else{
        const skill = dice_player?.[0]?.skill;
        const dices = dice_player?.[0]?.dice;
        dices.splice(dice.indexOf(dice),1);
        skill[prop] - 1;
        await ctx.database.set('dice_player',{userId},{skill,dice:dices})
        return await Introduction[prop].Category.filter(a =>{
            return eval(a)(ctx, userId, dice, Introduction[prop].harm);
          })
      }
    })

}
async function 血量判定(ctx,userId,guildId) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const dice_group = await ctx.database.get('dice_group',{guildId});
  if(dice_player?.[0]?.HP <= 0){
    await ctx.database.remove('dice_group',{guildId})
    await ctx.database.remove('dice_player',{userId})
    return `${userId}\n血量清零\n${ userId != dice_group?.[0]?.Play_1_userId ? dice_group?.[0]?.Play_1_userId : dice_group?.[0]?.Play_2_userId}获胜`
  }else{
    return
  }
}
async function 诅咒判定(ctx,userId) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  if(dice_player?.[0]?.curse >= 1 && Random.bool(0.5) == true){
    await ctx.database.set('dice_player',{userId},{curse:dice_player?.[0]?.curse - 1})
    return `诅咒 骰子失效`
  }else{
    return
  }
}
async function 中毒判定(ctx,userId) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  // ["燃烧":"burn","冰冻": "freeze","中毒": "poison", "诅咒":"curse","护盾":"shield"]
  if(dice_player?.[0]?.poison >= 1){
    await ctx.database.set('dice_player',{userId},{HP:dice_player?.[0]?.HP - dice_player?.[0]?.poison,poison:dice_player?.[0]?.poison - 1})
    return `中毒 血量-${dice_player?.[0]?.poison}`
  }else{
    return
  }
}
async function 状态判定(ctx,userId) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const dices = dice_player?.[0]?.dice;
  if(dice_player?.[0]?.burn >= 1){
    dices.splice(0,dice_player?.[0]?.burn);//从0开始删除dice个骰子，也就是燃烧
    await ctx.database.set('dice_player',{userId},{dice:dices});
    return `燃烧${dice_player?.[0]?.burn}骰子`
  }else if(dice_player?.[0]?.freeze >= 1){
  const a = dices.map((element, index) => (index < dice_player?.[0]?.burn ? 1 : element));
  await ctx.database.set('dice_player',{userId},{dice:a})
  return `冰冻${dice_player?.[0]?.burn}骰子`
  }
}
async function 颠倒(ctx,userId,dice,harm) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const sum = 7 - Number(dice)
  const dices = dice_player?.[0]?.dice;
  dices.push(sum);
  await ctx.database.set('dice_player',{userId},{dice:dices})
  return `骰子点数变为${sum}`
}
async function 重投更大(ctx,userId,dice,harm) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const sum = random.int(dice,6);
  const dices = dice_player?.[0]?.dice;
  dices.push(sum);
  await ctx.database.set('dice_player',{userId},{dice:dices})
  return `重投骰子${sum}点`
}
async function 重投(ctx,userId,dice,harm) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const sum = random.int(1,6);
  const dices = dice_player?.[0]?.dice;
  dices.push(sum);
  await ctx.database.set('dice_player',{userId},{dice:dices})
  return `重投骰子${sum}点`
}
async function 复制(ctx,userId,dice,harm) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const new_hanrm = eval(harm.replace("□",dice));
  const dices = dice_player?.[0]?.dice;
  dices.push(new_hanrm)
  await ctx.database.set('dice_player',{userId},{dice:dices})
  return `复制了一个骰子`
}
async function 燃烧(ctx,userId,dice,harm = '') {
  const dice_player = await ctx.database.get('dice_player',{userId});
  await ctx.database.set('dice_player',{userId},{burn:dice_player?.[0]?.burn + 1})
  return `燃烧*1`
}
async function 护盾(ctx,userId,dice,harm) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const new_hanrm = eval(harm.replace("□",dice));
  await ctx.database.set('dice_player',{userId},{shield:dice_player?.[0]?.shield + new_hanrm})
  return `护盾*${new_hanrm}`
}
async function 冰冻(ctx,userId,dice,harm = '') {
  const dice_player = await ctx.database.get('dice_player',{userId});
  await ctx.database.set('dice_player',{userId},{freeze:dice_player?.[0]?.freeze + 1})
  return `冰冻*1`
}
async function 中毒(ctx,userId,dice,harm = '') {
  const dice_player = await ctx.database.get('dice_player',{userId});
  await ctx.database.set('dice_player',{userId},{poison:dice_player?.[0]?.poison + 4})
  return `中毒*1`
}
/**
 * 回复生命调用函数
 */
async function 回复(ctx,userId,dice,harm = '') {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const a = dice + dice_player?.[0]?.HP;
  await ctx.database.set('dice_player',{userId},{HP:(a >= 50 ? 50 : a)})
  return `回复${a}生命值\n`
}
/**
 * 造成伤害调用函数
 * @param ctx 上下文
 * @param userId 用户id
 * @param dice 点数
 * @param harm 伤害
 * @returns 返回造成伤害
 */
async function 造成(ctx,userId,dice,harm){
  const dice_player = await ctx.database.get('dice_player',{userId});
  const dice_player_2 = await ctx.database.get('dice_player',{userId:dice_player?.[0]?.counterparties})
  const new_hanrm = eval(harm.replace("□",dice));
  if(dice_player_2?.[0]?.shield <= 0){
    await ctx.database.set('dice_player',{userId:dice_player?.[0]?.counterparties},{HP:dice_player_2?.[0]?.HP - new_hanrm})
    return `\n造成${new_hanrm}伤害`
  }else{
    return await 护盾判定(ctx,dice_player?.[0]?.counterpartiesm,new_hanrm)
  }
}
/**
 * 自身伤害调用函数
 * @param ctx 上下文
 * @param userId 用户id
 * @param dice 点数
 * @param harm 伤害
 * @returns 返回自身造成伤害
 */
async function 自身(ctx,userId,dice,harm) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  const new_hanrm = eval(harm.replace("□",dice));
  if(dice_player?.[0]?.shield <= 0){
    await ctx.database.set('dice_player',{userId},{HP:dice_player?.[0]?.HP - new_hanrm})
    return `\n自身受到${new_hanrm}伤害`
  }else{
    return await 护盾判定(ctx,userId,new_hanrm)
  }
}
/**
 * 护盾判定函数
 * @param ctx 上下文
 * @param userId 用户id
 * @param harm 伤害
 * @returns 显示护盾抵挡的具体伤害
 */
async function 护盾判定(ctx,userId,harm) {
  const dice_player = await ctx.database.get('dice_player',{userId});
  if(dice_player?.[0]?.shield >= harm){
    await ctx.database.set('dice_player',{userId},{HP:dice_player?.[0]?.HP - (dice_player?.[0]?.shield-harm),shield:dice_player?.[0]?.shield - harm})
    return `护盾抵挡${harm}伤害`
  }else{
    await ctx.database.set('dice_player',{userId},{HP:dice_player?.[0]?.HP - (harm-dice_player?.[0]?.shield),shield:0})
    return `护盾抵挡${dice_player?.[0]?.shield}伤害`
  }
  }
/**
 * 显示当前HP血条
 * @param currentHP 当前血量
 * @param maxHP 最大血量
 * @returns 文字型血条
 */
function HP(currentHP, maxHP) {
  if (currentHP < 0) {
      currentHP = 0;
  }else if (currentHP > maxHP) {
      currentHP = maxHP;
  }
  const percentage = Math.floor((currentHP / maxHP) * 100);
  const barLength = Math.floor((percentage / 10));
  const progressBar = '[' + '='.repeat(barLength) + ' '.repeat(10 - barLength) + ']';
  return progressBar + currentHP;
}
/**
 * 显示状态
 * @param statu 状态
 * @returns 
 */
async function Display_Status(ctx,userId){
  const dice_player = await ctx.database.get('dice_player',{userId});
  const Battle_Status = ["燃烧","冰冻","中毒","诅咒","护盾"]
  const statu = {0:dice_player?.[0]?.burn,1:dice_player?.[0]?.freeze,2:dice_player?.[0]?.poison,3:dice_player?.[0]?.curse,4:dice_player?.[0]?.shield}
  const result = Object.keys(statu)
      .filter(key => parseInt(key) >= 0 && parseInt(key) < Battle_Status.length && statu[key] > 0)
      .map(key => `${Battle_Status[parseInt(key)]}*${statu[key]}`)
      .join(', ') || '暂无';
  return result
}
/**
 * 显示骰子
 * @param dicey 点数
 * @returns 
 */
function Show_Dice(dicey:string[]) {
  let text = '';
  const dice = ['0','⚀','⚁','⚂','⚃','⚄','⚅'];
  dicey.filter(pride => {
    text += `${dice[pride]}\t`
});
  return text;
}
/**
 * 显示装备
 * @param skills 装备列表
 * @returns 
 */
function Show_equipment(skills){
  let msg = '';
  let i = 1;
  skills.filter(pride => {
    msg += `${i++}.${pride}:${Introduction[pride].descriptions}\n`
});
return msg;
}
/**
 * 生成玩家装备
 * @param {Context} ctx 上下文
 * @param {string} userId 玩家ID
 */
async function Generating_equipment(ctx:Context,userId:string){  
  const outfit = ["剑","匕首","回旋镖"];
  const Attributes = ["毒药咒语","火球","雪球","诅咒"];
  const Defence =["治愈水晶","木质盾牌"];
  const Auxiliary = ["复制","铲","绝佳手气"];
  const unusual = ["战斗翻滚"];
  const Play_1_skills = [random.pick(outfit),random.pick(Attributes),random.pick(Defence),random.pick(Auxiliary),random.pick(unusual)];
  const Play_1_skill = {[Play_1_skills[0]]:Introduction[Play_1_skills[0]].quantities,[Play_1_skills[1]]:Introduction[Play_1_skills[1]].quantities,[Play_1_skills[2]]:Introduction[Play_1_skills[2]].quantities,[Play_1_skills[3]]:Introduction[Play_1_skills[3]].quantities,[Play_1_skills[4]]:Introduction[Play_1_skills[4]].quantities};
  const Play_1_dice:string[] = [`${random.int(1,6)}`,`${random.int(1,6)}`,`${random.int(1,6)}`,`${random.int(1,6)}`];
  await ctx.database.create('dice_player',{userId,HP:50,skills:Play_1_skills,skill:Play_1_skill,dice:Play_1_dice});
}
/**
 * 生成骰子
 * @param {Context} ctx 上下文
 * @param {string} userId 玩家ID
 */
async function Generate_Dice(ctx:Context,userId:string) {
  const random = new Random(() => Math.random());
  const Play_1_dice:string[] = [`${random.int(1,6)}`,`${random.int(1,6)}`,`${random.int(1,6)}`,`${random.int(1,6)}`];
  await ctx.database.set('dice_player',{userId},{dice:Play_1_dice})
}
/**
 * 重置玩家装备次数
 * @param {Context} ctx 上下文
 * @param {string} userId 玩家ID
 */
async function Reset_times(ctx:Context,userId:string) {
  const Introduction = {
    "剑": {descriptions:"造成□伤害",austerity:3,dice:'',quantities:1,Category:['造成']},
    "匕首": {descriptions:"[1-3]造成□伤害",austerity:1,dice:'1-3',quantities:9,Category:['造成']},
    "回旋镖": {descriptions:"造成□*2伤害,自身受到□伤害",austerity:3,quantities:1,Category:['造成','自身']},
    "火球": {descriptions:"[偶数]造成□伤害,燃烧1个骰子",austerity:2,dice:'偶数',quantities:1,Category:['造成','燃烧']},
    "雪球": {descriptions:"[奇数]造成□伤害,冰冻1个骰子",austerity:2,dice:'奇数',quantities:1,Category:['造成','冰冻']},
    "诅咒": {descriptions:"[1]造成□+1伤害，施加1层诅咒",austerity:0,dice:1,quantities:1,Category:['造成','诅咒']},
    "毒药咒语": {descriptions:"[3]施加4层中毒",austerity:0,dice:3,quantities:1,Category:['诅咒']},
    "治愈水晶": {descriptions:"[1-3]回复□生命值",austerity:1,dice:'1-3',quantities:1,Category:['回复']},
    "木质盾牌": {descriptions:"[1-4]获得□点护盾",austerity:1,dice:'1-3',quantities:1,Category:['护盾']},
    "复制": {descriptions:"[4-6]复制1个骰子",austerity:1,dice:'4-6',quantities:1,Category:['复制']},
    "铲": {descriptions:"颠倒1个骰子",austerity:3,dice:'',quantities:1,Category:['颠倒']},
    "绝佳手气": {descriptions:"[1-5]重投1个点数更大的骰子",austerity:1,dice:'1-5',quantities:1,Category:['重投更大']},
    "战斗翻滚": {descriptions:"重投1个骰子(3次)",austerity:3,dice:'',quantities:1,Category:['重投']}
  };
  const read = await ctx.database.get('dice_player',{userId});
  const Play_1_skills = read?.[0]?.skills;
  const Play_1_skill = {[Play_1_skills[0]]:Introduction[Play_1_skills[0]].quantities,[Play_1_skills[1]]:Introduction[Play_1_skills[1]].quantities,[Play_1_skills[2]]:Introduction[Play_1_skills[2]].quantities,[Play_1_skills[3]]:Introduction[Play_1_skills[3]].quantities,[Play_1_skills[4]]:Introduction[Play_1_skills[4]].quantities};
  await ctx.database.set('dice_player',{userId},{skill:Play_1_skill})
}
/**
 * 骰子判断
 * @param {number} Decision 骰子判断条件
 * @param dice_a 玩家骰子
 * @param dice_b 约束骰子
 */
async function Dice_Decision(Decision:number,dice_a,dice_b){
  // Decision说明：0 表示只能投出指定点数的骰子，例如 [1] 表示只能投出点数为 1 的骰子;
  // 1 表示只能投出指定范围内的点数，如 [1-5] 表示只能投出点数在 1 到 5 之间的骰子;
  // 2 表示只能投出奇数或偶数的点数，例如 [奇数] [偶数] 表示只能投出奇数或偶数的点数;
  // 3代表无任何约束只需要任意点数即可.
  if(Decision == 0 && dice_a == dice_b){
    return true;
  }else if(Decision == 1 && dice_a > dice_b.split('-')[0] && dice_a < dice_b.split('-')[1]){
    return true;
  }else if(Decision == 2 ){
    if(dice_b == '偶数' && dice_a % 2 == 0){
      return true;
    }else if(dice_b == '奇数' && dice_a % 2 == 1){
      return true;
    }
  }else if(Decision == 3){
    return true;
  }else{
    return false;
  }
}