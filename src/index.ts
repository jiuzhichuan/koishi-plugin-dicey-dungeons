import { Context, Schema, Random, renameProperty, defineConfig, h, sleep, Session } from 'koishi'
import { kbbtn } from './method/method';
// 导入 Koishi 的 canvas 服务类型 （这样导入也可以用 puppeteer 提供的 canvas 服务）
import { } from '@koishijs/canvas';
import { } from "@koishijs/plugin-adapter-qq"
import { } from "@koishijs/plugin-server-temp";
import { resolve } from 'path';
import { pathToFileURL } from 'url'
import { readFile } from "fs/promises";
export const name = 'dicey-dungeons';
const random = new Random(() => Math.random());
export const inject = {
  required: ['canvas'],
}
export const usage = `# <center>【骰子地下城】</center><center>全新版本！！</center><center>炒鸡好玩的回合对战游戏</center>

# <center>👉[![alt 爱发电](https://static.afdiancdn.com/static/img/logo/logo.png) 爱发电](https://afdian.net/a/jiuzhichuan)  👈</center>
 如果对这个插件感到满意，可以小小的充个电，让我有更大开发动力

## 🔈更新公告 
- 1.4.8 更加适配官方机器人md 仅支持开发者
- 1.4.7版本，支持md按钮，但目前只支持开发者使用的md，用户可能暂无办法使用
- 1.4.1响应玩家反馈，将每回合装备改为随机化，将生死掌握给幸运
- 1.3.8版本修复puppter插件和canvas不能一起用


## 📕 建议
字体文件：https://wwp.lanzoue.com/i1M8R1tbs3sb
使用字体文件可见图片生成的好看些，自愿选择

## 🎈 介绍
由偶然间玩的一款游戏“骰子地下城”开发的一款插件，
尽可能的还原游戏里的操作
插件名叫———\`koishi-plugin-dicey-dungeons\`
目前仅支持一群一对战哦~

## ⚔️全新文图对战
![对战信息图](https://i0.hdslb.com/bfs/article/26c454d1829919c9da537d6b8a84e7d3486188624.png)

## 🎮 使用
指令|说明|例子|优化版本
:-:|:-:|:-:|:-:
创建角色|创建自己的角色|创建角色 小明 男
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
- [初始作者](mqqapi://card/show_pslcard?src_type=internal&source=sharecard&version=1&uin=2413933494) 2413933494
- [麦佬](mqqapi://card/show_pslcard?src_type=internal&source=sharecard&version=1&uin=1207108696) - 1207108696
- [塑梦](mqqapi://card/show_pslcard?src_type=internal&source=sharecard&version=1&uin=3523335883) - 3523335883`

export const Config = Schema.intersect([
  Schema.object({
    MarkdownOn: Schema.boolean().default(false),
  }).description('是否开启md'),
  Schema.union([
    Schema.object({
      MarkdownOn: Schema.const(true).required().description('开启md，用于开发者'),
      markdownId: Schema.string().required().description('使用md，用于开发者'),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    管理员: Schema.array(String).required().role('table').description('填写QQ,用于重置对战'),
  })])


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
  game_status: number; // 游戏状态 2代表游戏开始 1代表游戏准备，0代表暂未开始
  Round: number;
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
export interface data {
  userId: string; // 玩家id 主键
  username: string; //玩家昵称
  usergender: string; // 玩家性别
  usersuite: string[]; // 玩家套装
}

const Introduction = {
  // descriptions是装备描述 austerity是类别 dice是点数 quantities是数量 harm是伤害 Category函数调用 trigger是触发条件 例如3可以触发锁定骰子 trigger_
  "剑": { descriptions: "造成□伤害", trigge: 0, austerity: 3, dice: '', quantities: 1, harm: '□', Category: ['造成'] },
  "匕首": { descriptions: "[1-3]造成□伤害", trigge: 0, austerity: 1, dice: '1-3', quantities: 9, harm: '□', Category: ['造成'] },
  "回旋镖": { descriptions: "造成□*2伤害,自身受到□伤害", trigge: 0, austerity: 3, quantities: 1, harm: '□*2', Category: ['造成', '自身'] },
  "火球": { descriptions: "[偶数]造成□伤害,燃烧1个骰子", trigge: 0, austerity: 2, dice: '偶数', quantities: 1, harm: '□', Category: ['造成', '燃烧'] },
  "雪球": { descriptions: "[奇数]造成□伤害,冰冻1个骰子", trigge: 0, austerity: 2, dice: '奇数', quantities: 1, harm: '□', Category: ['造成', '冰冻'] },
  "诅咒": { descriptions: "[1]造成□+1伤害,施加1层诅咒", trigge: 0, austerity: 0, dice: 1, quantities: 1, harm: '□+1', Category: ['造成', '诅咒'] },
  "毒药咒语": { descriptions: "[3]施加4层中毒", trigge: 0, austerity: 0, dice: 3, quantities: 1, harm: '□+1', Category: ['中毒'] },
  "治愈水晶": { descriptions: "[1-3]回复□生命值", trigge: 0, austerity: 1, dice: '1-3', quantities: 1, harm: '□', Category: ['回复'] },
  "木质盾牌": { descriptions: "[1-4]获得□点护盾", trigge: 0, austerity: 1, dice: '1-4', quantities: 1, harm: '□', Category: ['护盾'] },
  "复制": { descriptions: "[4-6]复制1个骰子", trigge: 0, austerity: 1, dice: '4-6', quantities: 1, harm: '□', Category: ['复制'] },
  "铲": { descriptions: "颠倒1个骰子", trigge: 0, austerity: 3, dice: '', quantities: 1, harm: '□', Category: ['颠倒'] },
  "绝佳手气": { descriptions: "[1-5]重投1个点数更大的骰子", trigge: 0, austerity: 1, dice: '1-5', quantities: 1, harm: '□', Category: ['重投更大'] },
  "战斗翻滚": { descriptions: "重投1个骰子", trigge: 0, austerity: 3, dice: '', quantities: 3, harm: '□', Category: ['重投'] },
  "轻顶": { descriptions: "[1-5]□+1", trigge: 0, austerity: 1, dice: '1-5', quantities: 1, harm: '□+1', Category: ['轻顶'] },
  "干草叉": { descriptions: "[1-4]造成□伤害,燃烧&震慑骰子", trigge: 0, austerity: 1, dice: '1-4', quantities: 1, harm: '□', Category: ['造成', '燃烧', '震慑'] },
  "渔网": { descriptions: "[1-3]造成□伤害,[3]锁定1个骰子", trigge: 3, trigge_skill: ['造成', '锁定'], austerity: 1, dice: '1-3', quantities: 1, harm: '□', Category: ['造成'] },
  "吸血": { descriptions: "[1-4]造成□伤害,回复□生命值", trigge: 0, austerity: 1, dice: '1-4', quantities: 1, harm: '□', Category: ['造成', '回复'] },
};
export interface Config {
  MarkdownOn: boolean
  markdownId: string
  管理员: string[]
}
export let config: Config
export async function apply(ctx: Context, cfg: Config) {
  config = cfg
  ctx.model.extend('dice_player', {
    userId: 'string',
    username: 'string',
    HP: { type: 'unsigned', initial: 0 },
    dice: 'list',
    skills: 'list',
    skill: 'json',
    burn: { type: 'unsigned', initial: 0 },
    freeze: { type: 'unsigned', initial: 0 },
    poison: { type: 'unsigned', initial: 0 },
    curse: { type: 'unsigned', initial: 0 },
    shield: { type: 'unsigned', initial: 0 },
    awe: { type: 'unsigned', initial: 0 },
    lock: { type: 'unsigned', initial: 0 },
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
    Round: 'unsigned'
  }, {
    primary: 'guildId',
  });
  ctx.model.extend('dice_data', {
    userId: 'string', // 玩家id 主键
    username: 'string', //玩家昵称
    usergender: 'string', // 玩家性别
    usersuite: 'list', // 玩家套装
  }, {
    primary: 'userId',
  })
  /**
   * @param username_1 玩家1姓名
   * @param username_2 玩家2姓名
   * @param statu_1 玩家1 状态
   * @param statu_2 玩家2 状态
   * @param HP_1 玩家1血量
   * @param HP_2 玩家1血量
   * @param Round 回合数
   * @param dicey_1 玩家1 骰子
   * @param dicey_2 玩家2 骰子
   * @param siklls_1 玩家1 技能
   * @param siklls_2 玩家2 技能
   * @param sikll_1 玩家1 技能数量
   * @param sikll_2 玩家2 技能数量
   * @returns 返回图像buffer
   */
  let testcanvas: string
  try {
    testcanvas = 'file://'
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'dice_1.png')}`)
  } catch (e) {
    testcanvas = ''
  }
  const images = [null,
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'dice_1.png')}`),
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'dice_2.png')}`),
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'dice_3.png')}`),
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'dice_4.png')}`),
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'dice_5.png')}`),
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'dice_6.png')}`),
  ];
  const xingbie = {
    '男': await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'nan.png')}`),
    '女': await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'nv.png')}`),
  };
  async function main(
    username_1: string,
    username_2: string,
    usergender_1: string,
    usergender_2: string,
    statu_1: string,
    statu_2: string,
    HP_1: number,
    HP_2: number,
    Round: string,
    dicey_1: string[],
    dicey_2: string[],
    siklls_1: string[],
    siklls_2: string[],
    sikll_1: object,
    sikll_2: object) {
    const canvas = await ctx.canvas.createCanvas(1546, 1546); // 底图大小为 1546x1546
    const context = canvas.getContext('2d');
    const baseImage = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './img', 'ditu.jpg')}`);    // 加载底图
    context.drawImage(baseImage, 0, 0, 1546, 1546);
    const drawHP_1 = await drawHPBar(ctx, HP_1, 50);
    const drawHP_2 = await drawHPBar(ctx, HP_2, 50);
    const hpBarImage_1 = await ctx.canvas.loadImage(drawHP_1);
    const hpBarImage_2 = await ctx.canvas.loadImage(drawHP_2);
    const xy_1 = [[15, 658], [158, 658], [301, 658], [15, 790], [158, 790], [301, 790]];// 绘制骰子图片的位置
    const xy_2 = [[1133, 658], [1278, 658], [1420, 658], [1133, 790], [1278, 790], [1420, 790]];
    const top_left_1 = { 1: [1000, 30], 2: [1100, 30], 3: [1200, 30], 4: [1300, 30], 5: [1400, 30] };
    const top_left_2 = { 1: [1000, 1130], 2: [1100, 1130], 3: [1200, 1130], 4: [1300, 1130], 5: [1400, 1130] };
    context.font = '180px Unifont-JP';    // 回合数
    context.fillStyle = '#9b9b9b';
    context.fillText('Round ' + Round, 460, 250);
    await Promise.all(dicey_1.map(async (dice, index) => {
      context.drawImage(images[dice], xy_1[index][0], xy_1[index][1], 100, 100);
    }));
    // 批量绘制右侧骰子
    await Promise.all(dicey_2.map(async (dice, index) => {
      context.drawImage(images[dice], xy_2[index][0], xy_2[index][1], 100, 100);
    }));
    // 批量绘制左侧装备
    await Promise.all(siklls_1.map(async (skill, index) => {
      if (sikll_1[skill] > 0) {
        context.font = '60px Unifont-JP';
        context.fillStyle = 'white';
        context.fillText(`${index + 1}.${skill}x${sikll_1[skill]}`, top_left_1[index + 1][1], top_left_1[index + 1][0]);
      }
    }));
    // 批量绘制右侧装备
    await Promise.all(siklls_2.map(async (skill, index) => {
      if (sikll_2[skill] > 0) {
        context.font = '60px Unifont-JP';
        context.fillStyle = 'white';
        context.fillText(`${index + 1}.${skill}x${sikll_2[skill]}`, top_left_2[index + 1][1], top_left_2[index + 1][0]);
      }
    }));
    // 显示人物图
    context.save(); // 保存当前绘图状态
    context.scale(-1, 1); // 水平翻转图像
    context.drawImage(xingbie[usergender_1], -280, 180); // 左边人物图 在翻转后的坐标系中绘制图像
    context.restore(); // 恢复之前保存的绘图状态
    context.drawImage(xingbie[usergender_2], 1270, 180); // 右边人物图
    //插入玩家1状态
    // 使用正则表达式匹配status字符串中的14个字符（包括空格或结束符）
    context.font = '50px Unifont-JP';
    const text_1 = statu_1.match(/.{1,9}(\s|$)/g);
    let text_y_1 = 700; // 初始 Y 坐标位置
    text_1?.forEach(line => {// 逐行插入文字
      context.fillText(line, 420, text_y_1);
      text_y_1 += 80; // 每行文字之间的间距
    });
    //插入玩家2状态
    // 使用正则表达式匹配status字符串中的14个字符（包括空格或结束符）
    context.font = '50px Unifont-JP';
    const text_2 = statu_2.match(/.{1,9}(\s|$)/g);
    let text_y_2 = 700; // 初始 Y 坐标位置
    text_2.forEach(line => {// 逐行插入文字
      context.fillText(line, 780, text_y_2);
      text_y_2 += 80; // 每行文字之间的间距
    });
    // 插入主装备描述
    context.font = '48px Unifont-JP';
    context.fillStyle = 'white';
    const nickname_1 = username_1.length > 4 ? username_1.substring(0, 4) + '..' : username_1;
    const nickname_2 = username_2.length > 4 ? username_2.substring(0, 4) + '..' : username_2;
    const c = `${nickname_1}的装备描述:\n${await Show_equipment(siklls_1, sikll_1)}`;
    const lines = c.split('\n');
    let y = 1045; // 初始 Y 坐标位置
    lines.forEach(line => {// 逐行插入文字
      context.fillText(line, 435, y);
      y += 80; // 每行文字之间的间距
    });
    // 玩家昵称
    context.font = 'bold 60px Unifont-JP';
    context.fillStyle = 'white';
    context.fillText(nickname_1, 90, 180); // 在 x 轴 600 的位置绘制文本
    context.fillText(nickname_2, 1330, 180); // 在 x 轴 900 的位置绘制文本
    context.drawImage(hpBarImage_1, 0, 0);// 血条1
    context.drawImage(hpBarImage_2, 1230, 0);// 血条2
    return canvas.toBuffer('image/png');
  }
  async function sending(session: Session, text: string, commandList: string[] = [], type: number[] = []) {
    let a = text.replace(/\~\~(.+?)\~\~/g, '$1') // 移除删除线
      .replace(/\*([^*]+)\*/g, '$1') // 移除单星号斜体
      .replace(/\*\*(.+?)\*\*/g, '$1') // 移除双星号粗体
      .replace(/\[(.*?)\]\((.*?)\)(?:\s+"(.*)")?\s*$/gm, '$1') // 移除链接
      .replace(/^\>\s?(.*)$/gm, '$1') // 移除引用
      .replace(/\!\[(.*?)\]\((.*?)\)/g, '$1'); // 移除图片链接及描述
    if (cfg['MarkdownOn'] == true) {
      return await testmd(session, text, commandList, type)
    } else {
      session.send(text)
    }
  }
  //判断是否有参加，并且消息等于 骰子 装备
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
  ctx.command('骰子地下城')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const commandList = ["创建对战", "加入对战", "开始对战", "结束回合", "重置对战", "状态说明", "关于游戏"];
      const type = [2, 2, 2, 2, 2, 2, 2]
      if (cfg['MarkdownOn'] == true) {
        const image = await upload(session, await readFile((__dirname + '/img/caid.png')));
        return await sending(session, `![img#1306 #1600](${image})`, commandList, type)
      } else {
        return h.image(pathToFileURL(resolve(__dirname, './img/caid.png')).href)
      }
    })
  ctx.command('骰子地下城')
    .subcommand('创建角色 <name> <genders>')
    .action(async ({ session }, name, genders) => {
      const { userId, guildId, username, platform } = session;
      const data = await ctx.database.get('dice_data', {});
      const player = await ctx.database.get('dice_data', { userId });
      if (!name && !genders) {
        return await sending(session, `══骰子地下城══\n创建角色失败\n格式错误\n正确示例：创建角色 小明 男`);
      } else if (player.length != 0) {
        return await sending(session, `══骰子地下城══\n创建角色失败\n你已经创建过角色了`);
      } else if (data.some(user => user.username === name)) {
        return await sending(session, `══骰子地下城══\n创建角色失败\n角色名称重复`);
      } else if (/^[\u4e00-\u9fa5]{2,6}$/.test(name) && /^(男|女)$/.test(genders)) {
        await ctx.database.create('dice_data', { userId, username: name, usergender: genders })
        return await sending(session, `══骰子地下城══\n创建角色成功\n角色昵称：${name}\n角色性别：${genders}\nTips:输入‘角色信息’查看角色状态\n性别可以在对战中显示不同的图像`);
      } else {
        return await sending(session, `══骰子地下城══\n姓名暂支持2-6长度的汉字\n性别暂支持(男|女)\n示例：创建角色 小红 女`);
      }
    })
  ctx.command('骰子地下城')
    .subcommand('角色信息')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform, id } = session;
      const a = platform == 'qq' ? '\u200b\n' : '';
      const commandList = ["创建对战", "加入对战", "开始对战", "结束对战", "重置对战", "状态说明", "关于游戏"];
      const player = await ctx.database.get('dice_data', { userId });
      if (player?.length == 0) {
        return await sending(session, `══骰子地下城══\n角色信息失败\n你还没有创建角色`)
      } else {
        return await sending(session, `══骰子地下城══\n角色ID：${player?.[0]?.userId}\n角色昵称：${player?.[0]?.username}\n角色性别：${player?.[0]?.usergender}`, commandList)
      }
    })
  ctx.command('骰子地下城')
    .subcommand('关于教程')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const commandList = ["创建对战", "加入对战", "开始对战", "结束对战", "重置对战", "状态说明", "关于游戏"];
      return await sending(session, `══骰子地下城══\n游戏流程：创建对战后邀请他人加入，后开始对战，进行游戏后，发送【对战信息】查看自己装备和点数，使用点数和装备的指令是：【点数 1 2】这样是用点数1来使用装备序号为2的装备`)
    })
  ctx.command('骰子地下城')
    .subcommand('更新公告')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      return await sending(session, `══骰子地下城══\n更新内容：\n由玩家建议将每回合装备随机化`)
    })
  ctx.command('骰子地下城')
    .subcommand('联系作者')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      return `反馈链接：https://wj.qq.com/s2/14317315/1908/`
    })
  ctx.command('骰子地下城')
    .subcommand('游戏介绍')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      return sending(session, `══骰子地下城══
⚀双人回合制对战
⚁每人获得5件装备和4个骰子
⚂骰子和装备次数每回合刷新
⚃有的装备使用会有限制点数
⚄【结束回合】结束当前回合
⚅【骰子点数(空格)装备序号】使用对应骰子和装备`)
    })
  ctx.command('骰子地下城')
    .subcommand('状态说明')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      return sending(session, `══骰子地下城══
状态:
⚀燃烧:按燃烧层数，燃烧骰子，使用会-2血量
⚁冰冻:按顺序冰冻骰子，点数变成1
⚂诅咒:骰子有50％概率失效
⚃中毒:每回合层数-1并造成伤害
⚄护盾:抵挡护盾层数的直接伤害
⚅震慑:按层数将对应的装备禁用一回合
⚀锁定:将x个骰子锁定本回合无法使用`)
    })
  ctx.command('骰子地下城')
    .subcommand('关于游戏')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const commandList = ["创建对战", "加入对战", "开始对战", "结束对战", "重置对战", "状态说明", "关于游戏"];
      return await sending(session, `══骰子地下城══\n游戏灵感来自：Dicey Dungeons\n原作者：BridgeBuilder-2413933494\n移植作者：1594817572\nPS：此游戏是从QRSpeed机器人框架的词库移植到koishi`, commandList);
    })
  ctx.command('骰子地下城')
    .subcommand('创建对战')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const at = h.select(session.elements, 'at');
      const play = at?.[0]?.attrs.id;
      const game_status = ['游戏结束', '游戏准备', '游戏开始'];
      const read = await ctx.database.get('dice_group', { guildId });
      const player = await ctx.database.get('dice_data', { userId });
      const commandList = ["创建对战", "加入对战", "重置对战"]
      if (player.length == 0) {
        const content = `══骰子地下城══\n创建对战失败\n你还没有创建角色\nTips:->指令:创建角色 角色昵称 角色性别\n->示例:创建角色 小明 男`;
        return await sending(session, content, commandList)
      } else if (read?.[0]?.game_status == 0 || !read?.[0]?.game_status) {
        await ctx.database.create('dice_group', { guildId, Play_1_userId: `${guildId + userId}`, Play_1_username: player?.[0]?.username, game_status: 1 })
        return await sending(session, `══骰子地下城══\n游戏正在创建\n玩家1：${player?.[0]?.username}\n玩家2:暂缺\nTips：发送‘加入对战’即可加入`, commandList)
      } else {
        return await sending(session, (read?.[0]?.game_status == 1) ? `══骰子地下城══\n游戏准备中\n玩家1：${read?.[0]?.Play_1_username}\n玩家2:暂缺\nTips：发送‘加入对战’即可加入` : (read?.[0]?.game_status == 2) ? `══骰子地下城══\n游戏开始了\n请等待当前对战结束\nTips：发送‘创建对战’即可加入` : '事出反常必有妖！\n->指令:重置对战', commandList);
      }
    });
  ctx.command('骰子地下城')
    .subcommand('加入对战')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const game_status = ['游戏结束', '游戏准备', '游戏开始'];
      const read = await ctx.database.get('dice_group', { guildId });
      const play_1 = await ctx.database.get('dice_player', { userId: read?.[0]?.Play_1_userId });
      const play_2 = await ctx.database.get('dice_player', { userId: read?.[0]?.Play_2_userId })
      const player = await ctx.database.get('dice_data', { userId });
      if (player.length == 0) {
        return await sending(session, `══骰子地下城══\n创建对战失败\n你还没有创建角色\nTips:->指令:创建角色 角色昵称 角色性别\n->示例:创建角色 小明 男`);
      } else if (read?.[0]?.game_status == 1 && `${guildId + userId}` != read?.[0]?.Play_1_userId) {
        await ctx.database.set('dice_group', { guildId }, { Play_2_userId: `${guildId + userId}`, Play_2_username: player?.[0]?.username, game_status: 2 })
        return await sending(session, `══骰子地下城══\n玩家1：${read?.[0]?.Play_1_username}\n玩家2：${player?.[0]?.username}\n请由玩家1开启对战\n->指令：开始对战`);
      } else {
        return await sending(session, (read?.[0]?.game_status == 1) ? `══骰子地下城══\n玩家1：${read?.[0]?.Play_1_username}\n玩家2：${read?.[0]?.Play_2_userId == '' ? '暂缺' : read?.[0]?.Play_2_username}\nTips：发送‘加入对战’即可加入` : (read?.[0]?.game_status == 2) ? `══骰子地下城══\n游戏开始了\n请等待当前对战结束\nTips：发送‘创建对战’即可加入` : '');
      }
    })
  ctx.command('骰子地下城')
    .subcommand('重置对战')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const dice_group = await ctx.database.get('dice_group', { guildId });
      if (dice_group?.[0]?.Play_1_userId == `${guildId + userId}` || dice_group?.[0]?.Play_2_userId == `${guildId + userId}` || cfg['管理员'].includes(userId)) {
        await ctx.database.remove('dice_group', { guildId })
        await ctx.database.remove('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
        await ctx.database.remove('dice_player', { userId: dice_group?.[0]?.Play_2_userId });
        return await sending(session, `══骰子地下城══\n->重置对战成功`)
      }
    })
  ctx.command('骰子地下城')
    .subcommand('结束回合').alias('回合结束')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
      const dice_player_1 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
      const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_2_userId });
      const player = dice_group?.[0]?.Play_1_userId == `${guildId + userId}` ? dice_group?.[0]?.Play_2_userId : dice_group?.[0]?.Play_1_userId;
      const play = await ctx.database.get('dice_data', { userId });
      if (play.length == 0) {
        return await sending(session, `══骰子地下城══\n创建对战失败\n你还没有创建角色\nTips:->指令:创建角色 角色昵称 角色性别\n->示例:创建角色 小明 男`);
      } else if (dice_group?.[0]?.game_status != 2) {
        return await sending(session, `游戏还没开始`)
      } else if (dice_group?.[0]?.bout.replace(guildId, '') != userId) {
        return await sending(session, '还没有轮到你的回合')
      } else if (dice_player_1?.[0]?.HP <= 0) {
        return await sending(session, await 血量判定(ctx, dice_group?.[0]?.Play_1_userId, dice_group?.[0]?.Play_1_username, guildId))
      } else if (dice_player_2?.[0]?.HP <= 0) {
        return await sending(session, await 血量判定(ctx, dice_group?.[0]?.Play_2_userId, dice_group?.[0]?.Play_2_username, guildId))
      } else {
        await ctx.database.set('dice_group', { guildId }, { bout: player, Round: dice_group?.[0]?.Round + 1 })
        await Reset_times(ctx, player) // 重置装备
        await Generate_Dice(ctx, player) // 重置骰子
        // await Generating_equipment(ctx, dice_group[0].Play_1_userId); // 生成玩家1装备&骰子
        // await Generating_equipment(ctx, dice_group[0].Play_2_userId); // 生成玩家2装备&骰子
        return await sending(session, `接下来轮到\n【${platform == 'qq' ? `<@${player}>` : h.at(player.replace(guildId, ''))}】\n装备和骰子已刷新\n${await 状态判定(ctx, dice_player?.[0]?.counterparties)}`)
      }
    })
  ctx.command('骰子地下城')
    .subcommand('开始对战')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player_1 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
      const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_2_userId });
      const player = await ctx.database.get('dice_data', { userId });
      if (player.length == 0) {
        return await sending(session, `══骰子地下城══\n创建对战失败\n你还没有创建角色\nTips:->指令:创建角色 角色昵称 角色性别\n->示例:创建角色 小明 男`);
      } else if (dice_group?.[0]?.game_status == 2 && `${guildId + userId}` == dice_group?.[0]?.Play_1_userId) {
        const random = new Random(() => Math.random());
        const bout = random.pick([dice_group?.[0]?.Play_1_userId.replace(guildId, ''), dice_group?.[0]?.Play_2_userId.replace(guildId, '')]);
        await Generating_equipment(ctx, dice_group[0].Play_1_userId);
        await Generating_equipment(ctx, dice_group[0].Play_2_userId);
        await ctx.database.set('dice_group', { guildId }, { bout, Round: 1 });
        await ctx.database.set('dice_player', { userId: dice_group?.[0]?.Play_1_userId }, { username: dice_group?.[0]?.Play_1_username, counterparties: dice_group?.[0]?.Play_2_userId });
        await ctx.database.set('dice_player', { userId: dice_group?.[0]?.Play_2_userId }, { username: dice_group?.[0]?.Play_2_username, counterparties: dice_group?.[0]?.Play_1_userId });
        return await sending(session, `══骰子地下城══\n➢【${dice_group?.[0]?.Play_1_username}】\nPK\n➣【${dice_group?.[0]?.Play_2_username}】\n【${platform == 'qq' ? `<@${bout}>` : h.at(bout.replace(guildId, ''))}】\n先手进攻\n输入【对战信息】查看装备`);
      }
    })
  ctx.command('骰子地下城')
    .subcommand('对战信息')
    .action(async ({ session }) => {
      const { userId, guildId, username, platform } = session;
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player_1 = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
      const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_player_1?.[0]?.counterparties });
      const player_1 = await ctx.database.get('dice_data', { userId });
      const player_2 = await ctx.database.get('dice_data', { userId: dice_player_1?.[0]?.counterparties.replace(guildId, '') });
      const statu_1 = await Display_Status(ctx, `${guildId + userId}`);
      const statu_2 = await Display_Status(ctx, dice_player_1?.[0]?.counterparties);
      if (dice_player_1.length == 0) {
        return '';
      } else {
        const image = await main(
          player_1?.[0]?.username,
          player_2?.[0]?.username,
          player_1?.[0]?.usergender,
          player_2?.[0]?.usergender,
          statu_1,
          statu_2,
          dice_player_1?.[0]?.HP,
          dice_player_2?.[0]?.HP,
          String(dice_group?.[0]?.Round),
          dice_player_1?.[0]?.dice,
          dice_player_2?.[0]?.dice,
          dice_player_1?.[0]?.skills,
          dice_player_2?.[0]?.skills,
          dice_player_1?.[0]?.skill,
          dice_player_2?.[0]?.skill);
        return h.image(image, 'image/png');
      }
    })
  ctx.command('骰子地下城')
    .subcommand('点数 <dice> <props>')
    .action(async ({ session }, dice, props) => {
      const { userId, guildId, username, platform } = session;
      const dice_group = await ctx.database.get('dice_group', { guildId });
      const dice_player = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
      const dice_player_1 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_1_userId });
      const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_group?.[0]?.Play_2_userId });
      const prop = dice_player?.[0]?.skills[Number(props) - 1];
      const statu = await 对战判定(ctx, guildId, `${guildId + userId}`, dice, props);
      const player = await ctx.database.get('dice_data', { userId });
      const a = platform == 'qq' ? '\u200b\n' : '';
      if (dice_group?.[0]?.game_status != 2) {
        return sending(session, `══骰子地下城══\n还没开始对战呢`);
      } else if (dice_group?.[0]?.bout.replace(guildId, '') != userId) {
        return sending(session, `${a}══骰子地下城══\n还不是你的回合哦`)
      } else if (!prop) {
        return sending(session, '══骰子地下城══\n你没这个装备')
      } else if (Number(dice_player?.[0]?.skill?.[prop]) <= 0) { // 判断装备是否小于等于0
        return sending(session, `══骰子地下城══\n这个装备次数已用完`)
      } else if (dice_player?.[0]?.dice.length == 0) {
        return sending(session, `══骰子地下城══\n你没有骰子了，输入【结束回合】`)
      } else if (!dice_player?.[0]?.dice.includes(dice)) {
        return sending(session, `══骰子地下城══\n你没有这个骰子`)
      } else if (await Dice_Decision(Introduction[prop].austerity, dice, Introduction[prop].dice) == false) {
        return sending(session, `══骰子地下城══\n骰子不符合装备，无法使用`)
      } else if (dice_player_1?.[0]?.HP <= 0) {
        return sending(session, `${await 血量判定(ctx, dice_group?.[0]?.Play_1_userId, dice_group?.[0]?.Play_1_username, guildId)}`)
      } else if (dice_player_2?.[0]?.HP <= 0) {
        return sending(session, `${await 血量判定(ctx, dice_group?.[0]?.Play_2_userId, dice_group?.[0]?.Play_2_username, guildId)}`)
      } else if (statu['statu'] == true) {
        return sending(session, `${statu['msg']}`)
      } else if (/^[0-9]+$/.test(dice) && /^[0-9]+$/.test(props)) {
        const skill = dice_player?.[0]?.skill;
        const dices = dice_player?.[0]?.dice;
        const n = dice == Introduction[prop]['trigge'] ? 'trigge_skill' : 'Category';
        dices.splice(dices.indexOf(dice), 1); //减少骰子
        skill[prop] -= 1; //减少装备次数
        let msg = '';// 设置玩家技能和骰子
        await ctx.database.set('dice_player', { userId: `${guildId + userId}` }, { skill, dice: dices });
        const effects = await Promise.all(Introduction[prop][n].map(async a => {
          return effect[a](ctx, `${guildId + userId}`, dice, Introduction[prop].harm);
        }));
        msg += effects.join('\n'); // 将所有异步函数的结果连接成一个字符串
        const p1 = await ctx.database.get('dice_player', { userId: `${guildId + userId}` });
        await sending(session, `══骰子地下城══\n玩家：${player?.[0]?.username}\n骰子:${Show_Dice(p1?.[0]?.dice)}\n使用${prop}\n${msg}`) // 发送使用装备消息
      }
    });
  ctx.platform('qq').command('md <markdown:text>', { strictOptions: true }).action(async ({ session }, markdown) => {
    markdown = markdown.replace(/[\n\r]/g, '\\r')
    markdown = markdown.replace(/"/g, '\\"')
    try {
      markdown = JSON.parse(`"${markdown}"`)
    } catch (error) {
      return '解析失败'
    }
    markdown = markdown.replace(/\n/g, '\r')
    markdown = markdown.replace(/^# /g, '#§ ')
    markdown = markdown.replace(/^> /g, '>§ ')
    markdown = markdown.replace(/^- /g, '-§ ')
    markdown = markdown.replace(/^(\d)\. /g, '$1§. ')
    markdown = markdown.replace(/(\[.*?\])(\s?\(.*?\))/g, '$1§$2')
    markdown = markdown.replace(/(\[.*?\])(\s?\[.*?\])/g, '$1§$2')
    markdown = markdown.replace(/(<[^@].*?)>/g, '$1§>')
    markdown = markdown.replace(/```/g, '`§``')
    markdown = markdown.replace(/---/g, '-§--')
    markdown = markdown.replace(/_([^§]+?)(?=_)/g, '_$1§')
    markdown = markdown.replace(/\*([^§]+?)(?=\*)/g, '*$1§')
    markdown = markdown.replace(/`([^§]+?)(?=`)/g, '`$1§')
    const params = markdown.split('§')
    try {
      await session.qq.sendMessage(session.channelId, {
        msg_type: 2,
        msg_id: session.messageId,
        markdown: {
          custom_template_id: cfg['markdownId'],
          params: Array(100).fill(null).map((_, index) => ({ key: `text${index + 1}`, values: [params[index] ?? ' '] })),
        },
      })
    } catch (error) {
      return error.response?.data ? h.text(`发送失败 ${JSON.stringify(error.response.data, null, 4)}`.replace(/\./g, '\u200b.')) : '发送失败'
    }
  })
}
async function upload(session: Session, data: Buffer) {
  const file = await session.qq.sendFileGuild(session.channelId, { file_type: 1, srv_send_msg: false, file_data: data.toString('base64') })
  const buffer = Buffer.from(file.file_info, 'base64')
  const index = buffer.lastIndexOf('/download')
  const path = buffer.subarray(index, index + buffer[index - 2]).toString().replace(/_/g, '%5f')
  return `http://multimedia.nt.qq.com${path}`
}

async function testmd(session: Session<never, never, Context>, markdown: string, keyboard: string[] = [], type: number[] = [], entry: boolean[] = []) {
  markdown = markdown.replace(/[\n\r]/g, '\\r')
  markdown = markdown.replace(/"/g, '\\"')
  try {
    markdown = JSON.parse(`"${markdown}"`)
  } catch (error) {
    return '解析失败'
  }
  markdown = markdown.replace(/\n/g, '\r')
  markdown = markdown.replace(/^# /g, '#§ ')
  markdown = markdown.replace(/^> /g, '>§ ')
  markdown = markdown.replace(/^- /g, '-§ ')
  markdown = markdown.replace(/^(\d)\. /g, '$1§. ')
  markdown = markdown.replace(/(\[.*?\])(\s?\(.*?\))/g, '$1§$2')
  markdown = markdown.replace(/(\[.*?\])(\s?\[.*?\])/g, '$1§$2')
  markdown = markdown.replace(/(<[^@].*?)>/g, '$1§>')
  markdown = markdown.replace(/```/g, '`§``')
  markdown = markdown.replace(/---/g, '-§--')
  markdown = markdown.replace(/_([^§]+?)(?=_)/g, '_$1§')
  markdown = markdown.replace(/\*([^§]+?)(?=\*)/g, '*$1§')
  markdown = markdown.replace(/`([^§]+?)(?=`)/g, '`$1§')
  const params = markdown.split('§')
  let data = {
    msg_type: 2,
    msg_id: session.messageId,
    markdown: {
      custom_template_id: config['markdownId'],
      params: Array(100).fill(null).map((_, index) => ({ key: `text${index + 1}`, values: [params[index] ?? ' '] })),
    }
  };
  keyboard.length == 0 ? data : data['keyboard'] = { content: kbbtn(keyboard, type, session, entry) };
  try {
    await session.qq.sendMessage(session.channelId, data);
  } catch (error) {
    return error.response?.data ? h.text(`发送失败 ${JSON.stringify(error.response.data, null, 4)}`.replace(/\./g, '\u200b.')) : '发送失败'
  }
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
    dices.splice(dices.indexOf(dice), 1); //减少骰子
    skill[prop] -= 1; //减少装备次数
    await ctx.database.set('dice_player', { userId }, { skill, dice: dices, curse: dice_player?.[0]?.curse - 1 });
    return { statu: true, msg: `══骰子地下城══\n诅咒生效！骰子使用失败\n此次使用的骰子和装备照样减少` }
  } else if (dice_player?.[0]?.awe > 0 && props == dice_player?.[0]?.awe) {
    dices.splice(dices.indexOf(dice), 1); //减少骰子
    await ctx.database.set('dice_player', { userId }, { skill, dice: dices, awe: dice_player?.[0]?.awe - 1 });
    return { statu: true, msg: `══骰子地下城══\n震慑生效！使用骰子解禁装备` }
  } else if (dice_player?.[0]?.burn > 0 && dices.indexOf(dice) == dice_player?.[0]?.burn - 1) {
    const n = (dice == Introduction[prop]['trigge']) ? 'trigge_skill' : 'Category';
    skill[prop] -= 1; //减少装备次数
    let msg = '';
    await ctx.database.set('dice_player', { userId }, { HP: dice_player?.[0]?.HP - 2, burn: dice_player?.[0]?.burn - 1, skill });
    const effects = await Promise.all(Introduction[prop][n].map(async a => { return effect[a](ctx, `${guildId + userId}`, dice, Introduction[prop].harm); }));
    msg += effects.join('\n');
    return { statu: true, msg: `══骰子地下城══\n燃烧生效！血量-2\n${msg}` }
  } else {
    return { statu: false, msg: '' }
  }
}
async function drawHPBar(ctx, currentHP, maxHP) {
  const canvasWidth = 300; // 画布宽度
  const canvasHeight = 60; // 画布高度，增加了以容纳文字
  const barWidth = 300; // 血条宽度
  const barHeight = 60; // 血条高度
  const padding = 0; // 血条与画布边缘的间距
  // 创建画布
  const canvas = await ctx.canvas.createCanvas(canvasWidth, canvasHeight);
  const context = canvas.getContext('2d');
  // 清空画布
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  // 根据当前血量计算血条长度
  const percentage = Math.floor((currentHP / maxHP) * 100);
  const barLength = Math.floor((percentage / 100) * barWidth);
  // 绘制血条背景
  context.fillStyle = 'white';
  context.fillRect(padding, padding, barWidth, barHeight);
  // 绘制血条
  context.fillStyle = 'red';
  context.fillRect(padding, padding, barLength, barHeight);
  // 绘制文字显示当前血量
  context.fillStyle = 'black'; // 修改文字颜色为黑色
  context.font = '50px Unifont-JP'; // 调整字体大小
  const text = 'HP: ' + currentHP + '/' + maxHP;
  // 调整文字位置，确保在可见区域内
  context.fillText(text, 0, barHeight / 2 + 13);
  return canvas.toBuffer();
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
    .map(key => `${Battle_Status[parseInt(key)]}x${statu[key]}`)
    .join(' ') || ' ';
  return result
}
/**
 * 显示骰子
 * @param dicey 点数
 * @returns
 */
function Show_Dice(dicey) {
  let text = '';
  const dice = ['0', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  dicey.filter(pride => {
    text += `${dice[pride]} `;
  });
  return text;
}
/**
 * 显示装备
 * @param skills 装备列表
 * @returns 
 */
async function Show_equipment(skills, skill) {
  let msg = '';
  let i = 0;
  skills.forEach((pride) => {
    i++;
    if (skill[pride] > 0) {
      msg += `${i}.${Introduction[pride].descriptions} \n`;
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
  const dice_player = await ctx.database.get('dice_player', { userId });
  const outfit = ["剑", "匕首", "回旋镖",]; // 攻击技能
  const Attributes = ["毒药咒语", "火球", '吸血', "雪球", "诅咒",]; // 属性技能
  const Defence = ["治愈水晶", "木质盾牌"]; // 防御技能
  const Auxiliary = ["绝佳手气", "铲", "轻顶"]; // 辅助技能
  const unusual = ["战斗翻滚"]; // 角色技能 
  const Play_1_skills = [random.pick(outfit), random.pick(Attributes), random.pick(Defence), random.pick(Auxiliary), random.pick(unusual)];
  const Play_1_skill = { [Play_1_skills[0]]: Introduction[Play_1_skills[0]].quantities, [Play_1_skills[1]]: Introduction[Play_1_skills[1]].quantities, [Play_1_skills[2]]: Introduction[Play_1_skills[2]].quantities, [Play_1_skills[3]]: Introduction[Play_1_skills[3]].quantities, [Play_1_skills[4]]: Introduction[Play_1_skills[4]].quantities };
  const Play_1_dice: string[] = [`${random.int(1, 7)}`, `${random.int(1, 7)}`, `${random.int(1, 7)}`, `${random.int(1, 7)}`];
  if (dice_player.length == 0) {
    await ctx.database.create('dice_player', { userId, HP: 50, skills: Play_1_skills, skill: Play_1_skill, dice: Play_1_dice });
  } else {
    await ctx.database.set('dice_player', { userId }, { skills: Play_1_skills, skill: Play_1_skill, dice: Play_1_dice });
  }
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
  async 锁定(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { lock: dice_player?.[0]?.lock + 1 })
    return `施加状态：锁定*1`
  },
  async 颠倒(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const sum = String(7 - Number(dice))
    const dices = dice_player?.[0]?.dice;
    dices?.push(sum);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `骰子点数变为${sum}`
  },
  async 轻顶(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const new_hanrm = eval(harm.replace("□", String(dice)));
    const dices = dice_player?.[0]?.dice;
    dices?.push(new_hanrm);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `将骰子转为${new_hanrm}点`
  },
  async 重投更大(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const sum = String(random.int((Number(dice) + 1), 6));
    const dices = dice_player?.[0]?.dice;
    dices?.push(sum);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `重投更大骰子${sum}点`
  },
  async 重投(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const sum = String(random.int(1, 6));
    const dices = dice_player?.[0]?.dice;
    dices?.push(sum);
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `重投骰子${sum}点`
  },
  async 复制(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const new_hanrm = eval(harm.replace("□", String(dice)));
    const dices = dice_player?.[0]?.dice;
    dices.push(new_hanrm)
    await ctx.database.set('dice_player', { userId }, { dice: dices })
    return `复制了一个骰子`
  },
  async 诅咒(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { curse: dice_player?.[0]?.curse + 1 })
    return `施加状态：诅咒*1`
  },
  async 震慑(ctx, userId, dice, harm) {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { awe: dice_player?.[0]?.awe + 1 })
    return `施加状态：震慑*1`
  },
  async 燃烧(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { burn: dice_player?.[0]?.burn + 1 })
    return `施加状态：燃烧*1`
  },
  async 护盾(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const new_hanrm = eval(harm.replace("□", String(dice)));
    await ctx.database.set('dice_player', { userId }, { shield: dice_player?.[0]?.shield + new_hanrm })
    return `施加状态：护盾*${new_hanrm}`
  },
  async 冰冻(ctx: Context, userId: string, dice: number, harm: string = '') {
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
  async 回复(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const a = Number(dice) + dice_player?.[0]?.HP;
    await ctx.database.set('dice_player', { userId }, { HP: (a >= 50 ? 50 : a) })
    return `回复${dice}生命值\n`
  },
  async 造成(ctx: Context, userId: string, dice: number, harm: string = '') {
    const dice_player = await ctx.database.get('dice_player', { userId });
    const dice_player_2 = await ctx.database.get('dice_player', { userId: dice_player?.[0]?.counterparties })
    const new_hanrm = eval(harm.replace("□", String(dice)));
    if (Number(dice_player_2?.[0]?.shield) <= 0 || !dice_player_2?.[0]?.shield) {
      await ctx.database.set('dice_player', { userId: dice_player?.[0]?.counterparties }, { HP: dice_player_2?.[0]?.HP - new_hanrm });
      return `造成${new_hanrm}伤害`
    } else {
      return await 护盾判定(ctx, dice_player?.[0]?.counterparties, new_hanrm)
    }
  },
  async 自身(ctx: Context, userId: string, dice: number, harm: string = '') {
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