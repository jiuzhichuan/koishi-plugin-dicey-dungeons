import { Session } from "koishi"

export interface QQMDMessageData {
    content: string
    msg_type: number
    markdown: {
        custom_template_id: string
        params: MDParms[]
    }
    keyboard?: {
        content:Rows
    }
    msg_id: string
    timestamp: number
    msg_seq: number
}

interface Rows {
    rows: buttons[]
}

interface buttons {
    buttons: KeyBoardParms[]
}

interface KeyBoardParms {
    id: string,
    render_data: {
        label: string,
        visited_label?: string
    },
    action: {
        type: number,// 0 跳转按钮：http 或 小程序 客户端识别 scheme， 1 回调按钮：回调后台接口, data 传给后台， 2 指令按钮：自动在输入框插入 @bot data
        permission: {
            type:  number,//2为所有人,0为指定成员
            specify_user_ids:string[]
        },
        unsupport_tips: string,
        data: string,
        enter:boolean //是否点击发送消息，默认为true
    },
}

interface MDParms {
    key: string
    values: string[]
}


export async function sendmarkdownMessage(session: Session, markdownData: QQMDMessageData): Promise<void> {
    await session.bot.internal.sendMessage(session.channelId, markdownData)
}



// export function markdown(mdStr: string[],session:Session,keyboard:string[],entry:boolean=true): QQMDMessageData {
//     return {
//         content: "111",
//         msg_type: 2,
//         markdown: {
//             custom_template_id: config.markdownId,
//             params: md(mdStr)
//         },
//         keyboard: {
//             content: kbbtn(keyboard, session,entry),
//         },
//         msg_id: session.messageId,
//         timestamp: new Date().getTime(),
//         msg_seq: Math.floor(Math.random() * 1000000),
//     }
// }

// export function md(content: string[]): MDParms[] {
//     //config配置对象转为数组
//     const keys = [config.key1, config.key2, config.key3, config.key4, config.key5, config.key6, config.key7, config.key8, config.key9, config.key10]

//     //根据config配置对象，生成markdown数据
//     const data = keys.map((key, index) => {
//         return {
//             key: key,
//             values: [content[index]]
//         }
//     }).filter(item => item.values[0] !== undefined && item.values[0] !== "")//过滤掉undefined的数据

//     //返回markdown数据
//     return data
// }

export function kbbtn(a: string[],b:number[],session: Session,enter:boolean[]=[],text:string[]=[]): Rows {
    const type = b.length == 0 ? 2 : b;
    const enters = enter.length == 0 ? true : enter;
    const data = a.map((item, index) => {
        const test = text.length == 0 ? `/${item}` : text;
        return {
            id: index.toString(),
            render_data: {
                label: item,
                visited_label: item
            },
            action: {
                type: (type == 2 ? 2 :type[index]),// 0 跳转按钮：http 或 小程序 客户端识别 scheme， 1 回调按钮：回调后台接口, data 传给后台， 2 指令按钮：自动在输入框插入 @bot data
                permission: {
                    type: 2,//2为所有人,0为指定成员
                    // specify_user_ids: [session.userId]
                },
                unsupport_tips: "",
                data: (test == `/${item}` ? `/${item}` : test[index]),
                enter: enters //是否点击发送消息，默认为true
            },
        }
    })

    let rows = []
    let buttons = []
    data.forEach((item, index) => {
        buttons.push(item)
        if (buttons.length === 3 || index === data.length - 1) {
            rows.push({ buttons: buttons })
            buttons = []
        }
    })
    return {rows}

}
