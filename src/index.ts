import { Context, Schema, Random, renameProperty, defineConfig, h } from 'koishi'
// 导入 Koishi 的 canvas 服务类型 （这样导入也可以用 puppeteer 提供的 canvas 服务）
import {} from '@koishijs/canvas';
export const name = 'dicey-dungeons';
const random = new Random(() => Math.random());
export const inject = {
  required: ['canvas'],
}
export const usage = `# <center>【骰子地下城】</center><center>抢先公测版本</center><center>炒鸡好玩的回合对战游戏</center>

# <center>👉[![alt 爱发电](https://static.afdiancdn.com/static/img/logo/logo.png) 爱发电](https://afdian.net/a/jiuzhichuan)  👈</center>
 如果对这个插件感到满意，可以小小的充个电，让我有更大开发动力

## 🎈 介绍
由偶然间玩的一款游戏“骰子地下城”开发的一款插件，
尽可能的还原游戏里的操作
插件名叫———\`koishi-plugin-dicey-dungeons\`
目前仅支持一群一对战哦~

## 🎮 使用
指令|说明|例子|优化版本
:-:|:-:|:-:|:-:
创建对战|创建对战让别人加入|创建对战
加入对战|加入别人创建的对战|加入对战
重置对战|可以在特殊情况下，重置当前对战|重置对战
对战信息|查看当前对战信息|对战信息
结束回合|查看自己的修仙面板状态|结束回合
点数 [骰子] [装备序号] | 对战中使用道具 | 点数 5 2 | 5 2 可用这种方式

## 📃 反馈
 [腾讯问卷](https://wj.qq.com/s2/14317315/1908/)

## 🙏 致谢
- [Koishi](https://koishi.chat/) - 机器人框架
- [Dicey Dungeons](https://diceydungeons.com/) - 灵感来源
- [初始作者](#) 2413933494`

const Introduction = {
  // descriptions是装备描述 austerity是类别 dice是点数 quantities是数量 harm是伤害 Category函数调用 trigger是触发条件 例如3可以触发锁定骰子 trigger_
  "剑": { descriptions: "造成□伤害", trigge: 0, austerity: 3, dice: '', quantities: 1, harm: '□', Category: ['造成'] },
  "匕首": { descriptions: "[1-3]造成□伤害", trigge: 0, austerity: 1, dice: '1-3', quantities: 9, harm: '□', Category: ['造成'] },
  "回旋镖": { descriptions: "造成□*2伤害,自身受到□伤害", trigge: 0, austerity: 3, quantities: 1, harm: '□*2', Category: ['造成', '自身'] },
  "火球": { descriptions: "[偶数]造成□伤害,燃烧1个骰子", trigge: 0, austerity: 2, dice: '偶数', quantities: 1, harm: '□', Category: ['造成', '燃烧'] },
  "雪球": { descriptions: "[奇数]造成□伤害,冰冻1个骰子", trigge: 0, austerity: 2, dice: '奇数', quantities: 1, harm: '□', Category: ['造成', '冰冻'] },
  "诅咒": { descriptions: "[1]造成□+1伤害，施加1层诅咒", trigge: 0, austerity: 0, dice: 1, quantities: 1, harm: '□+1', Category: ['造成', '诅咒'] },
  "毒药咒语": { descriptions: "[3]施加4层中毒", trigge: 0, austerity: 0, dice: 3, quantities: 1, harm: '□+1', Category: ['中毒'] },
  "治愈水晶": { descriptions: "[1-3]回复□生命值", trigge: 0, austerity: 1, dice: '1-3', quantities: 1, harm: '□', Category: ['回复'] },
  "木质盾牌": { descriptions: "[1-4]获得□点护盾", trigge: 0, austerity: 1, dice: '1-4', quantities: 1, harm: '□', Category: ['护盾'] },
  "复制": { descriptions: "[4-6]复制1个骰子", trigge: 0, austerity: 1, dice: '4-6', quantities: 1, harm: '□', Category: ['复制'] },
  "铲": { descriptions: "颠倒1个骰子", trigge: 0, austerity: 3, dice: '', quantities: 1, harm: '□', Category: ['颠倒'] },
  "绝佳手气": { descriptions: "[1-5]重投1个点数更大的骰子", trigge: 0, austerity: 1, dice: '1-5', quantities: 1, harm: '□', Category: ['重投更大'] },
  "战斗翻滚": { descriptions: "重投1个骰子", trigge: 0, austerity: 3, dice: '', quantities: 3, harm: '□', Category: ['重投'] },
  "轻顶": { descriptions: "[1-5]□+1", trigge: 0, austerity: 1, dice: '1-5', quantities: 1, harm: '□+1', Category: ['轻顶'] },
  "干草叉": { descriptions: "[1-4]造成□伤害，燃烧&震慑 骰子", trigge: 0, austerity: 1, dice: '1-4', quantities: 1, harm: '□', Category: ['造成', '燃烧', '震慑'] },
  "渔网": { descriptions: "[1-3]造成□伤害，点数3时锁定1个骰子", trigge: 3, trigge_skill: ['造成', '锁定'], austerity: 1, dice: '1-3', quantities: 1, harm: '□', Category: ['造成'] },
  "吸血": { descriptions: "[1-4]造成□伤害，回复□生命值", trigge: 0, austerity: 1, dice: '1-4', quantities: 1, harm: '□', Category: ['造成', '回复'] },
};

export interface Config {
  管理员: string[];
}

export const Config: Schema<Config> = Schema.object({
  管理员: Schema.array(String).required().role('table').description('填写QQ，用与重置对战'),
})


declare module 'koishi' {
  interface Tables {
    dice_group: group;
    dice_player: player;
    dice_data: data;
  }
}
// 对战房间数据
export interface group {
  guildId: string; // 群聊id
  Play_1_userId: string; // 玩家1id
  Play_1_username: string; // 玩家1昵称
  Play_2_userId: string; // 玩家2id
  Play_2_username: string; // 玩家2昵称
  bout: string; // 回合
  bouts:number;//回合数
  game_status: number; // 游戏状态 2代表游戏开始 1代表游戏准备，0代表暂未开始
}
// 玩家对战数据
export interface player {
  userId: string; // 玩家id
  username: string; //玩家昵称
  HP: number; // 玩家血量
  dice: string[]; // [⚀,⚁,⚂,⚃,⚄,⚅]
  skills: string[]; //技能列表[]
  skill: object; // 技能{}
  counterparties: string; //对手
  burn: number;  //燃烧
  freeze: number; //冰冻
  poison: number; // 中毒
  curse: number; // 诅咒
  shield: number; // 护盾
  awe: number; //震慑
  lock: number; // 锁定
}
export interface data{
  
}

export async function apply(ctx: Context, cfg: Config) {
  ctx.model.extend('dice_player', {
    userId: 'string',
    HP: {type:'unsigned',initial: 0},
    dice: 'list',
    skills: 'list',
    skill: 'json',
    burn: {type:'unsigned',initial: 0},
    freeze: {type:'unsigned',initial: 0},
    poison: {type:'unsigned',initial: 0},
    curse: {type:'unsigned',initial: 0},
    shield: {type:'unsigned',initial: 0},
    awe: {type:'unsigned',initial: 0},
    lock: {type:'unsigned',initial: 0},
    counterparties: 'string'
  }, {
    primary: 'userId',
  });
  ctx.model.extend('dice_group', {
    guildId: 'string',
    Play_1_userId: 'string',
    Play_1_username: 'string',
    Play_2_userId: 'string',
    Play_2_username: 'string',
    bout: 'string',
    game_status: 'unsigned',
  }, {
    primary: 'guildId',
  });
  async function main(Round:string,dicey_1:number[], dicey_2:number[],sikll_1:string[],sikll_2:string[]) {
    // 创建一个画布
    const canvas = await ctx.canvas.createCanvas(1546, 1546); // 底图大小为 1546x1546
    const context = canvas.getContext('2d');
    // 加载底图
    const baseImage = await ctx.canvas.loadImage('https://i0.hdslb.com/bfs/article/fba756e7389b448e2e90d3606fe23b67486188624.png');
    context.drawImage(baseImage, 0, 0, 1546, 1546);
    // 加载骰子图片
    const images = [null,await ctx.canvas.loadImage('https://i0.hdslb.com/bfs/article/c600e448a6273a85ae37e7b1e7b621db486188624.png'),await ctx.canvas.loadImage('https://i0.hdslb.com/bfs/article/f9086e4af3b46ab71001c8bede5a9858486188624.png'),await ctx.canvas.loadImage('https://i0.hdslb.com/bfs/article/bf35b6b096bfb63ab73680d939f6bb96486188624.png'),await ctx.canvas.loadImage('https://i0.hdslb.com/bfs/article/7298b5ef2dfdf4371066438e6f39ecd1486188624.png'),await ctx.canvas.loadImage('https://i0.hdslb.com/bfs/article/eb8ac0f07b93227e4bd91124eaa775bc486188624.png'),await ctx.canvas.loadImage('https://i0.hdslb.com/bfs/article/89a4b863565d7aab664a83f1b68597c7486188624.png')];
    // 绘制骰子图片的位置
    const xy_1 = [ [19, 760], [163, 760], [306, 760], [19, 904], [164, 904], [307, 904]];
    const xy_2 = [ [1130, 759], [1275, 760], [1417, 760], [1129, 904], [1275, 904], [1419, 904]];
    const top_left_1 = { 1: [1110, 60], 2: [1205, 60], 3: [1305, 60], 4: [1405,60], 5: [1505,60]};
    const top_left_2 = { 1: [1110, 1176], 2: [1205, 1176], 3: [1305, 1176], 4: [1405,1176], 5: [1505,1176]};
    // 绘制骰子图片到画布上
    context.font = '180px Unifont-JP';
    context.fillStyle = '#9b9b9b';
    context.fillText('Round '+Round,460,280);
    for (let i = 0; i < 6; i++) { // 左侧骰子
      context.drawImage(images[dicey_1[i]], xy_1[i][0], xy_1[i][1], 104, 104);
    }
    for (let i = 0; i < 6; i++) { // 右侧骰子
      // context.translate(image.width, 0); // 将坐标系进行水平移动
      // context.scale(-1, 1); // 对坐标系进行水平缩放，实现翻转
      context.drawImage(images[dicey_2[i]], xy_2[i][0], xy_2[i][1], 104, 104);
    }
    for (let i = 1; i <= 5; i++) { // 左侧装备
      context.font = '60px Unifont-JP';
      context.fillStyle = 'white';
      context.fillText(sikll_1[i-1], top_left_1[i][1],top_left_1[i][0]);
    }
    for (let i = 1; i <= 5; i++) { // 左侧装备
      context.font = '60px Unifont-JP';
      context.fillStyle = 'white';
      context.fillText(sikll_2[i-1], top_left_2[i][1],top_left_2[i][0]);
    }
    return canvas.toBuffer('image/png');
  }

  //判断是否有参加，并且消息等于骰子 序号
  ctx.middleware(async (session, next) => {
    const a = /^[1-6]$/?.test(session.content.split(' ')[0]);
    const b = /^[1-6]$/?.test(session.content.split(' ')[1]);
    const { userId, guildId, username, platform, content } = session;
    const read = await ctx.database.get('dice_group', { guildId });
    const play = read?.[0]?.Play_1_userId.replace(guildId, '') === userId ? true : read?.[0]?.Play_2_userId.replace(guildId, '') === userId ? true : false; //|| read?.[0]?.Play_2_userId === userId;
    if (a == true && b == true && read?.[0]?.game_status == 2 && play == true) {
      session.execute(`点数 ${content.split('-')[0]} ${session.content.split('-')[1]}`)
    } else {
      return next()
    }
  })
  ctx.command('1')
  .action(async ({})=>{
    const image = await main('3',[1, 2, 3, 4, 5, 6], [6, 5, 5, 5, 2, 1],['匕首','诅咒','治愈水晶','绝佳手气','战斗翻滚'],['回旋镖','吸血','治愈水晶','绝佳手气','战斗翻滚']);
    return h.image(image, 'image/png')
  })
  ctx.command('骰子地下城')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      return `${h.image('https://i0.hdslb.com/bfs/article/7a7d2920014964cbce358b287c1b609d486188624.png')}`
    })
  ctx.command('骰子地下城')
  .subcommand('关于教程')
  .action(async ({session})=>{
    const { userId, guildId, username, platform } = session;
    const a = platform == 'qq' ? '\u200b\n' : '';
    return `${a}══骰子地下城══\n游戏流程：创建对战后邀请他人加入，后开始对战，进行游戏后，发送【对战信息】查看自己装备和点数，使用点数和装备的指令是：【点数 1 2】这样是用点数1来使用装备序号为2的装备`
  })
  ctx.command('骰子地下城')
    .subcommand('更新公告')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      return `${a}══骰子地下城══\n更新内容：\n加入对战的玩家可发送[点数] [序号]\n示例：1 2`
    })
  ctx.command('骰子地下城')
    .subcommand('联系作者')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      return `${a}反馈链接：https://wj.qq.com/s2/14317315/1908/`
    })
  ctx.command('骰子地下城')
    .subcommand('游戏介绍')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      return `${a}══骰子地下城══
⚀双人回合制对战
⚁每人获得5件装备和4个骰子
⚂骰子和装备次数每回合刷新
⚃有的装备使用会有限制点数
⚄【结束回合】结束当前回合
⚅【骰子点数(空格)装备序号】使用对应骰子和装备`
    })
  ctx.command('骰子地下城')
    .subcommand('状态说明')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      return `${a}══骰子地下城══
状态:
⚀燃烧:按燃烧层数，燃烧骰子，使用会-2血量
⚁冰冻:按顺序冰冻骰子，点数变成1
⚂诅咒:骰子有50％概率失效
⚃中毒:每回合层数-1并造成伤害
⚄护盾:抵挡护盾层数的直接伤害
⚅震慑:按层数将装备禁用一回合`
    })
  ctx.command('骰子地下城')
    .subcommand('关于游戏')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      return `${a}══骰子地下城══\n游戏灵感来自：Dicey Dungeons\n原作者：BridgeBuilder-2413933494\n移植作者：1594817572\nPS：此游戏是从QRSpeed机器人框架的词库移植到koishi`
    })
  ctx.command('骰子地下城')
    .subcommand('创建对战')
    .action(async ({ session }) => {
      const { userId, guildId, username } = session;
      const at = h.select(session.elements, 'at');
      const play = at?.[0]?.attrs.id;
      const game_status = ['游戏结束', '游戏准备', '游戏开始'];
      const read = await ctx.database.get('dice_group', { guildId })
      if (read?.[0]?.game_status == 0 || !read?.[0]?.game_status) {
        await ctx.database.create('dice_group', { guildId, Play_1_userId: `${guildId + userId}`, Play_1_username: username, game_status: 1 })
        return `══骰子地下城══\n游戏准备中\n玩家1：${username}[${userId}]\n玩家2:暂缺\nTips：发送‘加入对战’即可加入`
      } else {
        return (read?.[0]?.game_status == 1) ? `══骰子地下城══\n游戏准备中\n玩家1：${read?.[0]?.Play_1_userId}\n玩家2:暂缺\nTips：发送‘加入对战’即可加入` : (read?.[0]?.game_status == 2) ? `══骰子地下城══\n游戏开始了\n请等待当前对战结束\nTips：发送‘创建对战’即可加入` : '事出反常必有妖！\n请联系开发者';
      }
    })
  ctx.command('骰子地下城')
    .subcommand('加入对战')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      const game_status = ['游戏结束', '游戏准备', '游戏开始'];
      const read = await ctx.database.get('dice_group', { guildId });
      const play_1 = await ctx.database.get('dice_player', { userId: read?.[0]?.Play_1_userId });
      const play_2 = await ctx.database.get('dice_player', { userId: read?.[0]?.Play_2_userId })
      if (read?.[0]?.game_status == 1 && `${guildId + userId}` != read?.[0]?.Play_1_userId) {
        await ctx.database.set('dice_group', { guildId }, { Play_2_userId: `${guildId + userId}`, Play_2_username: username, game_status: 2 })
        return `${a}══骰子地下城══\n玩家1：${read?.[0]?.Play_1_username}\n玩家2：${username}\n请由玩家1开启对战\n->指令：开始对战`
      } else {
        return (read?.[0]?.game_status == 1) ? `${a}══骰子地下城══\n玩家1：${read?.[0]?.Play_1_username}\n玩家2：${read?.[0]?.Play_2_userId == '' ? '暂无' : read?.[0]?.Play_2_username}\n请由玩家1开启对战\n->指令：开始对战` : (read?.[0]?.game_status == 2) ? `${a}══骰子地下城══\n游戏开始了\n请等待当前对战结束\nTips：发送‘创建对战’即可加入` : '';
      }
    })
  ctx.command('骰子地下城')
    .subcommand('重置对战')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      const dice_group = await ctx.database.get('dice_group', { guildId });
      if (dice_group?.[0]?.Play_1_userId == `${guildId + userId}` || dice_group?.[0]?.Play_2_userId == `${guildId + userId}` || cfg['管理员'].includes(userId)) {
        await ctx.database.remove('dice_group', { guildId })
        await ctx.database.remove('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
        await ctx.database.remove('dice_player', { userId: dice_group?.[0]?.Play_2_userId });
        return `${a}══骰子地下城══\n->重置对战成功`
      }
    })
  ctx.command('骰子地下城')
    .subcommand('结束回合')
    .alias('回合结束')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
      const dice_player_1 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
      const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_2_userId });
      const player = dice_group?.[0]?.Play_1_userId == `${guildId + userId}` ? dice_group?.[0]?.Play_2_userId : dice_group?.[0]?.Play_1_userId;
      if (dice_group?.[0]?.game_status != 2) {
        return `游戏还没开始`
      } else if (dice_group?.[0]?.bout.replace(guildId, '') != userId) {
        return '还没有轮到你的回合'
      } else if (dice_player_1?.[0]?.HP <= 0) {
        return await 血量判定(ctx, dice_group?.[0]?.Play_1_userId, dice_group?.[0]?.Play_1_username, guildId)
      } else if (dice_player_2?.[0]?.HP <= 0) {
        return await 血量判定(ctx, dice_group?.[0]?.Play_2_userId, dice_group?.[0]?.Play_2_username, guildId)
      } else {
        await ctx.database.set('dice_group', { guildId }, { bout: player })
        await Reset_times(ctx, player)
        await Generate_Dice(ctx, player)
        return `${a}接下来轮到\n【${ platform == 'qq' ? player : h.at(player.replace(guildId, ''))}】\n装备和骰子已刷新\n${await 状态判定(ctx, dice_player?.[0]?.counterparties)}`
      }
    })
  ctx.command('骰子地下城')
    .subcommand('开始对战')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
      if (dice_group?.[0]?.game_status == 2 && `${guildId + userId}` == dice_group?.[0]?.Play_1_userId) {
        const random = new Random(() => Math.random());
        const bout = random.pick([dice_group?.[0]?.Play_1_userId, dice_group?.[0]?.Play_2_userId]);
        await Generating_equipment(ctx, dice_group[0].Play_1_userId);
        await Generating_equipment(ctx, dice_group[0].Play_2_userId);
        await ctx.database.set('dice_group', { guildId }, { bout });
        await ctx.database.set('dice_player', { userId: dice_group?.[0]?.Play_1_userId }, { counterparties: dice_group?.[0]?.Play_2_userId });
        await ctx.database.set('dice_player', { userId: dice_group?.[0]?.Play_2_userId }, { counterparties: dice_group?.[0]?.Play_1_userId });
        return `${a}══骰子地下城══\n➢【${dice_group?.[0]?.Play_1_userId.replace(guildId, '')}】\nPK\n➣【${dice_group?.[0]?.Play_2_userId.replace(guildId, '')}】\n【${ platform == 'qq' ? bout : h.at(bout.replace(guildId, ''))}】\n先手进攻\n输入【对战信息】查看装备`
      }
    })
  ctx.command('骰子地下城')
    .subcommand('对战信息')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
      if (dice_player.length == 0) {
        return ''
      } else {
        return `${a}
当前回合：${dice_group?.[0]?.bout.replace(guildId, '')}
➢玩家：${username}[${userId}]
血量：${HP(dice_player?.[0]?.HP, 50)}
骰子：${Show_Dice(dice_player?.[0]?.dice)}
状态：${await Display_Status(ctx, `${guildId + userId}`)}
${await Show_equipment(ctx, `${guildId + userId}`, dice_player?.[0]?.skills, dice_player?.[0]?.skill)}
指令：点数 骰子点数 装备序号`
      }
    })
  ctx.command('骰子地下城')
    .subcommand('点数 <dice> <props>')
    .action(async ({ session }, dice, props) => {
      const { userId, guildId, username, platform } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
      const dice_player_1 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
      const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_2_userId });
      const prop = dice_player?.[0]?.skills[Number(props) - 1];
      const statu = await 对战判定(ctx, guildId, `${guildId + userId}`, dice, props);
      if (dice_group?.[0]?.game_status != 2) {
        return `${a}══骰子地下城══\n还没开始对战呢`
      } else if (dice_group?.[0]?.bout.replace(guildId, '') != userId) {
        return `${a}══骰子地下城══\n还不是你的回合哦`
      } else if (!prop) {
        return '══骰子地下城══\n你没这个装备'
      } else if (Number(dice_player?.[0]?.skill?.[prop]) <= 0) { // 判断装备是否小于等于0
        return `${a}══骰子地下城══\n这个装备次数已用完`
      } else if (dice_player?.[0]?.dice.length == 0) {
        return `${a}══骰子地下城══\n你没有骰子了，输入【结束回合】`
      } else if (!dice_player?.[0]?.dice.includes(dice)) {
        return `${a}══骰子地下城══\n你没有这个骰子`
      } else if (await Dice_Decision(Introduction[prop].austerity, dice, Introduction[prop].dice) == false) {
        return `${a}══骰子地下城══\n骰子不符合装备，无法使用`
      } else if (dice_player_1?.[0]?.HP <= 0) {
        return await 血量判定(ctx, dice_group?.[0]?.Play_1_userId, dice_group?.[0]?.Play_1_username, guildId)
      } else if (dice_player_2?.[0]?.HP <= 0) {
        return await 血量判定(ctx, dice_group?.[0]?.Play_2_userId, dice_group?.[0]?.Play_2_username, guildId)
      } else if (statu['statu'] == true) {
        return statu['msg']
      } else if (/^[0-9]+$/.test(dice) && /^[0-9]+$/.test(props)) {
        const skill = dice_player?.[0]?.skill;
        const dices = dice_player?.[0]?.dice;
        const n = dice == Introduction[prop]['trigge'] ? 'trigge_skill' : 'Category';
        dices.splice(dices.indexOf(dice), 1); //减少骰子
        skill[prop] -= 1; //减少装备次数
        // 设置玩家技能和骰子
        let msg = '';
        await ctx.database.set('dice_player', { userId: `${guildId + userId}` }, { skill, dice: dices });
        const effects = await Promise.all(Introduction[prop][n].map(async a => {
          return effect[a](ctx, `${guildId + userId}`, dice, Introduction[prop].harm);
        })
        );
        msg += effects.join('\n'); // 将所有异步函数的结果连接成一个字符串
        return `${a}══骰子地下城══\n玩家：${username}\n${msg}`
      }
    });
}
// async函数，用于血量判定
async function 血量判定(ctx, userId, username, guildId) {
  // 获取玩家血量
  const dice_player = await ctx.database.get('dice_player', { userId });
  // 获取组血量
  const dice_group = await ctx.database.get('dice_group', { guildId });
  // 如果玩家血量小于等于0，则清除组和玩家的血量
  if (dice_player?.[0]?.HP <= 0) {
    await ctx.database.remove('dice_group', { guildId })
    await ctx.database.remove('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
    await ctx.database.remove('dice_player', { userId: dice_group?.[0]?.Play_2_userId })
    // 返回玩家ID，以及获胜者ID
    return `${username}\n血量清零\n${username != dice_group?.[0]?.Play_1_username ? dice_group?.[0]?.Play_1_username : dice_group?.[0]?.Play_2_username}获胜`
  } else {
    // 否则返回空
    return ''
  }
}
async function 对战判定(ctx, guildId, userId, dice, props) {
  const dice_player = await ctx.database.get('dice_player', { userId });
  const prop = dice_player?.[0]?.skills[Number(props) - 1];
  const skill = dice_player?.[0]?.skill;
  const dices = dice_player?.[0]?.dice;
  if (dice_player?.[0]?.curse > 0 && Random.bool(0.5) == true) {
    await ctx.database.set('dice_player', { userId }, { curse: dice_player?.[0]?.curse - 1 })
    dices.splice(dices.indexOf(dice), 1); //减少骰子
    skill[prop] -= 1; //减少装备次数
    await ctx.database.set('dice_player', { userId }, { skill, dice: dices });
    return { statu: true, msg: `══骰子地下城══\n诅咒生效！骰子使用失败\n此次使用的骰子和装备照样减少` }
  } else if (dice_player?.[0]?.awe > 0 && props == dice_player?.[0]?.awe) {
    dices.splice(dices.indexOf(dice), 1); //减少骰子
    await ctx.database.set('dice_player', { userId }, { skill, dice: dices });
    return { statu: true, msg: `══骰子地下城══\n震慑生效！使用骰子解禁装备` }
  } else if (dice_player?.[0]?.burn > 0 && dices.indexOf(dice) == dice_player?.[0]?.burn - 1) {
    const n = (dice == Introduction[prop]['trigge']) ? 'trigge_skill' : 'Category';
    dices.splice(dices.indexOf(dice), 1); //减少骰子
    skill[prop] -= 1; //减少装备次数
    let msg = '';
    await ctx.database.set('dice_player', { userId }, { HP: dice_player?.[0]?.HP - 2, burn: dice_player?.[0]?.burn - 1, skill, dice: dices, });
    const effects = await Promise.all(Introduction[prop][n].map(async a => { return effect[a](ctx, `${guildId + userId}`, dice, Introduction[prop].harm); }));
    msg += effects.join('\n');
    return { statu: true, msg: `══骰子地下城══\n燃烧生效！血量-2\n${msg}` }
  } else {
    return { statu: false, msg: '' }
  }
}
// async函数，用于状态判定
async function 状态判定(ctx, userId) {
  // 获取玩家状态
  const dice_player = await ctx.database.get('dice_player', { userId });
  // 获取玩家骰子
  const dices = dice_player?.[0]?.dice;
  // ["燃烧":"burn","冰冻": "freeze","中毒": "poison", "诅咒":"curse","护盾":"shield"]
  if (dice_player?.[0]?.freeze >= 1) {
    // 如果玩家冰冻大于等于1，则从0开始删除dice个骰子，也就是冰冻
    const a = dices.map((element, index) => (index < dice_player?.[0]?.freeze ? 1 : element));
    await ctx.database.set('dice_player', { userId }, { dice: a, freeze: dice_player?.[0]?.freeze - 1 })
    return `冰冻${dice_player?.[0]?.freeze}骰子`
  } else if (dice_player?.[0]?.poison >= 1) {
    await ctx.database.set('dice_player', { userId }, { HP: dice_player?.[0]?.HP - dice_player?.[0]?.poison, poison: dice_player?.[0]?.poison - 1 })
    return `中毒 血量-${dice_player?.[0]?.poison}`
  } else {
    // 否则返回空
    return ''
  }
}
// async函数，用于护盾判定
async function 护盾判定(ctx, userId, harm) {
  // 获取玩家护盾
  const dice_player = await ctx.database.get('dice_player', { userId });
  // 如果玩家护盾大于等于伤害，则减少玩家护盾，并返回减少的护盾
  if (dice_player?.[0]?.shield > harm) {
    await ctx.database.set('dice_player', { userId }, { shield: dice_player?.[0]?.shield - harm })
    return `护盾抵挡${harm}伤害`
  } else {
    // 如果玩家护盾小于等于伤害，则减少玩家血量，并返回减少的血量
    await ctx.database.set('dice_player', { userId }, { HP: dice_player?.[0]?.HP - (harm - dice_player?.[0]?.shield), shield: 0 })
    return `护盾抵挡${dice_player?.[0]?.shield}伤害,承受了${(harm - dice_player?.[0]?.shield)}伤害`
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
  } else if (currentHP > maxHP) {
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
async function Display_Status(ctx, userId) {
  const dice_player = await ctx.database.get('dice_player', { userId });
  const Battle_Status = ["燃烧", "冰冻", "中毒", "诅咒", "护盾", "震撼", '锁定']
  const statu = { 0: dice_player?.[0]?.burn, 1: dice_player?.[0]?.freeze, 2: dice_player?.[0]?.poison, 3: dice_player?.[0]?.curse, 4: dice_player?.[0]?.shield, 5: dice_player?.[0]?.awe, 6: dice_player?.[0]?.lock }
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
function Show_Dice(dicey: string[]) {
  let text = '';
  const dice = ['0', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  dicey.filter(pride => {
    text += `${dice[pride]} `
  });
  return text;
}
/**
 * 显示装备
 * @param skills 装备列表
 * @returns 
 */
async function Show_equipment(ctx, userId, skills, skill) {
  const dice_player = await ctx.database.get('dice_player', { userId });
  let msg = '';
  let i = 0;
  skills.forEach((pride) => {
    i++;
    const statu = dice_player?.[0]?.awe == i ? '[震慑]' : '';
    if (skill[pride] > 0) {
      msg += `${i}.${pride}:${Introduction[pride].descriptions} x${skill[pride]} ${statu}\n`;
    }
  });
  return msg;
}

/**
 * 生成玩家装备
 * @param {Context} ctx 上下文
 * @param {string} userId 玩家ID
 */
async function Generating_equipment(ctx: Context, userId: string) {
  const outfit = ["剑", "匕首", "回旋镖", "干草叉",];
  const Attributes = ["毒药咒语", "火球", '吸血', "雪球", "诅咒", "渔网"];
  const Defence = ["治愈水晶", "木质盾牌"];
  const Auxiliary = ["绝佳手气", "复制", "铲", "轻顶"];
  const unusual = ["战斗翻滚"];
  const Play_1_skills = [random.pick(outfit), random.pick(Attributes), random.pick(Defence), random.pick(Auxiliary), random.pick(unusual)];
  const Play_1_skill = { [Play_1_skills[0]]: Introduction[Play_1_skills[0]].quantities, [Play_1_skills[1]]: Introduction[Play_1_skills[1]].quantities, [Play_1_skills[2]]: Introduction[Play_1_skills[2]].quantities, [Play_1_skills[3]]: Introduction[Play_1_skills[3]].quantities, [Play_1_skills[4]]: Introduction[Play_1_skills[4]].quantities };
  const Play_1_dice: string[] = [`${random.int(1, 7)}`, `${random.int(1, 7)}`, `${random.int(1, 7)}`, `${random.int(1, 7)}`];
  await ctx.database.create('dice_player', { userId, HP: 50, skills: Play_1_skills, skill: Play_1_skill, dice: Play_1_dice });
}
/**
 * 生成骰子
 * @param {Context} ctx 上下文
 * @param {string} userId 玩家ID
 */
async function Generate_Dice(ctx: Context, userId: string) {
  const random = new Random(() => Math.random());
  const Play_1_dice: string[] = [`${random.int(1, 7)}`, `${random.int(1, 7)}`, `${random.int(1, 7)}`, `${random.int(1, 7)}`];
  await ctx.database.set('dice_player', { userId }, { dice: Play_1_dice })
}
/**
 * 重置玩家装备次数
 * @param {Context} ctx 上下文
 * @param {string} userId 玩家ID
 */
async function Reset_times(ctx: Context, userId: string) {
  const read = await ctx.database.get('dice_player', { userId });
  const Play_1_skills = read?.[0]?.skills;
  const Play_1_skill = { [Play_1_skills[0]]: Introduction[Play_1_skills[0]].quantities, [Play_1_skills[1]]: Introduction[Play_1_skills[1]].quantities, [Play_1_skills[2]]: Introduction[Play_1_skills[2]].quantities, [Play_1_skills[3]]: Introduction[Play_1_skills[3]].quantities, [Play_1_skills[4]]: Introduction[Play_1_skills[4]].quantities };
  await ctx.database.set('dice_player', { userId }, { skill: Play_1_skill })
}
/**
 * 骰子判断
 * @param {number} Decision 骰子判断条件
 * @param dice_a 玩家骰子
 * @param dice_b 约束骰子
 */
async function Dice_Decision(Decision: number, dice_a, dice_b) {
  // Decision说明：0 表示只能投出指定点数的骰子，例如 [1] 表示只能投出点数为 1 的骰子;
  // 1 表示只能投出指定范围内的点数，如 [1-5] 表示只能投出点数在 1 到 5 之间的骰子;
  // 2 表示只能投出奇数或偶数的点数，例如 [奇数] [偶数] 表示只能投出奇数或偶数的点数;
  // 3代表无任何约束只需要任意点数即可.
  if (Decision == 0 && dice_a == dice_b) {
    return true;
  } else if (Decision == 1 && Number(dice_a) >= Number(dice_b.split('-')[0]) && Number(dice_a) <= Number(dice_b.split('-')[1])) {
    return true;
  } else if (Decision == 2 && dice_b == '偶数' && dice_a % 2 == 0) {
    return true;
  } else if (Decision == 2 && dice_b == '奇数' && dice_a % 2 == 1) {
    return true;
  } else if (Decision == 3) {
    return true;
  } else {
    return false;
  }
}
const effect = {
  async 锁定(ctx, userId, dice, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { lock: dice_player?.[0]?.lock + 1 })
    return `施加状态：锁定*1`
  },
  async 颠倒(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const sum = 7 - Number(dice)
    const dices = dice_player?.[0]?.dice;
    dices.push(sum);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `骰子点数变为${sum}`
  },
  async 轻顶(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const new_hanrm = eval(harm.replace("□", Number(dice)));
    const dices = dice_player?.[0]?.dice;
    dices.push(new_hanrm);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `将骰子转为${new_hanrm}点`
  },
  async 重投更大(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const sum = random.int((Number(dice) + 1), 6);
    const dices = dice_player?.[0]?.dice;
    dices.push(sum);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `重投更大骰子${sum}点`
  },
  async 重投(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const sum = random.int(1, 6);
    const dices = dice_player?.[0]?.dice;
    dices.push(sum);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `重投骰子${sum}点`
  },
  async 复制(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const new_hanrm = eval(harm.replace("□", dice));
    const dices = dice_player?.[0]?.dice;
    dices.push(new_hanrm)
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `复制了一个骰子`
  },
  async 诅咒(ctx, userId, dice: number, harm = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { curse: dice_player?.[0]?.curse + 1 })
    return `施加状态：诅咒*1`
  },
  async 震慑(ctx, userId, dice, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { awe: dice_player?.[0]?.awe + 1 })
    return `施加状态：震慑*1`
  },
  async 燃烧(ctx, userId, dice: number, harm = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { burn: dice_player?.[0]?.burn + 1 })
    return `施加状态：燃烧*1`
  },
  async 护盾(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const new_hanrm = eval(harm.replace("□", dice));
    await ctx.database.set('dice_player', { userId }, { shield: dice_player?.[0]?.shield + new_hanrm })
    return `施加状态：护盾*${new_hanrm}`
  },
  async 冰冻(ctx, userId, dice: number, harm = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { freeze: dice_player?.[0]?.freeze + 1 })
    return `施加状态：冰冻*1`
  },
  async 中毒(ctx, userId, dice, harm = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_player?.[0]?.counterparties });
    const new_hanrm = eval(harm.replace("□", dice));
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { poison: dice_player_2?.[0]?.poison + 4 })
    return `施加状态：中毒*${new_hanrm}`
  },
  async 回复(ctx, userId, dice: number, harm = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const a = Number(dice) + dice_player?.[0]?.HP;
    await ctx.database.set('dice_player', { userId }, { HP: (a >= 50 ? 50 : a) })
    return `回复${dice}生命值\n`
  },
  async 造成(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_player?.[0]?.counterparties })
    const new_hanrm = eval(harm.replace("□", Number(dice)));
    if (Number(dice_player_2?.[0]?.shield) <= 0 || !dice_player_2?.[0]?.shield) {
      await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { HP: dice_player_2?.[0]?.HP - new_hanrm });
      return `造成${new_hanrm}伤害`
    } else {
      return await 护盾判定(ctx, dice_player?.[0]?.counterparties, new_hanrm)
    }
  },
  async 自身(ctx, userId, dice: number, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    // const new_hanrm = eval(harm.replace("□",Number(dice)));
    if (Number(dice_player?.[0]?.shield) <= 0 || !dice_player?.[0]?.shield) {
      await ctx.database.set('dice_player', { userId }, { HP: dice_player?.[0]?.HP - dice })
      return `自身受到${dice}伤害`
    } else {
      return await 护盾判定(ctx, userId, dice)
    }
  }
}