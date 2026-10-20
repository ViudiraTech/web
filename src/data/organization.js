// Curated organization content. Facts here are taken from the public READMEs and
// the organization profile on GitHub; live numbers (stars, forks, update times)
// are merged in from the GitHub API at render time and never hard-coded.

export const ORG = Object.freeze({
  name: 'ViudiraTech',
  github: 'https://github.com/ViudiraTech',
  motto: 'We don’t just use systems. We build them.',
  mottoZh: '我们不只是使用系统，我们亲手构建它们。',
  summary: 'ViudiraTech 是一个由中国学生发起的独立技术社区。我们从零编写内核、编译器、固件和开发工具，想弄明白计算机从上电到运行程序的每一层是怎样工作的，并把这些实验全部以开源的方式公开。',
});

export const FOCUS_AREAS = [
  {
    id: 'kernel',
    title: '操作系统内核',
    copy: '从引导、内存管理、调度到文件系统与网络栈，按 UNIX 的方式从零实现，并兼容 Linux 用户态。',
    repos: ['Uinxed-Kernel', 'SpaceKernel'],
  },
  {
    id: 'language',
    title: '系统编程语言',
    copy: '设计一门语法接近 Python、没有 GC、带所有权检查、可以直接写内核与驱动的 AOT 语言。',
    repos: ['Uinx'],
  },
  {
    id: 'firmware',
    title: '固件、模拟与教学系统',
    copy: '在 BIOS、处理器模拟器和用户态模拟操作系统里，把机器最底层的行为拆开来看。',
    repos: ['ApexBIOS', 'Sim6502', 'PySpOS'],
  },
  {
    id: 'tools',
    title: '工具与应用',
    copy: '终端 AI 编程助手、即时通讯、模组加载器——在自己的系统之上，做真正能用的软件。',
    repos: ['Uinxed-Agent', 'Paizer-Open-source-instant-messenger', 'ModLoader'],
  },
];

// Curated descriptions for featured repositories. `name` must match the GitHub
// repository name so live data (stars, forks, language) can be merged in.
export const FEATURED_PROJECTS = [
  {
    name: 'Uinxed-Kernel',
    title: 'Uinxed-Kernel',
    tagline: '从零编写的 x86-64 类 UNIX 宏内核',
    copy: '使用 C 编写，通过 Limine 以 UEFI / Legacy 启动，提供 Linux 兼容的系统调用 ABI。开发版本已经可以启动 Alpine Linux 用户态并运行 Xfce 桌面。',
    language: 'C',
    license: 'Apache-2.0',
    highlights: [
      'SMP 多核与 EEVDF 调度器',
      '四级分页、伙伴分配器、页缓存与 swap',
      'VFS：ext2/3/4、FAT/exFAT、NTFS、ISO 9660',
      '自研网络栈：IPv4/IPv6、TCP/UDP、DHCP',
      'DRM/KMS、NVMe、AHCI、USB、HD Audio 驱动',
    ],
    flagship: true,
  },
  {
    name: 'Uinx',
    title: 'Uinx',
    tagline: '类 Python 语法的 AOT 系统编程语言',
    copy: '缩进语法、所有权与借用检查、无 GC，经自有前端与 MIR 编译到 LLVM IR，可生成 x86_64 / aarch64 / riscv64 裸机内核工程。',
    language: 'C++',
    license: 'BSD-3-Clause',
  },
  {
    name: 'SpaceKernel',
    title: 'SpaceKernel',
    tagline: '用 Rust 重新实现的多架构内核',
    copy: 'Uinxed-Kernel 的 Rust 版本，面向 x86_64、aarch64 与 RISC-V 64，按“能编译、能启动、能测试”的阶段推进。',
    language: 'Rust',
  },
  {
    name: 'PySpOS',
    title: 'PySpOS',
    tagline: '用 Python 写的教学型模拟操作系统',
    copy: 'EEVDF 调度、fork/exec、作业控制、ELF 执行与 OTA 更新都在用户态实现，适合阅读和修改来学习操作系统概念。',
    language: 'Python',
    license: 'MIT',
  },
  {
    name: 'ApexBIOS',
    title: 'ApexBIOS',
    tagline: 'x86 32 位保护模式 BIOS',
    copy: '使用汇编与 C 编写的 BIOS 固件，从机器上电后的第一条指令开始理解启动流程。',
    language: 'C',
  },
  {
    name: 'Uinxed-Agent',
    title: 'Uinxed-Agent',
    tagline: '纯 Go 编写的终端 AI 编程助手',
    copy: '基于 Bubble Tea 的 TUI，支持主代理与子代理分工、沙箱 Shell、流式输出与会话保存，兼容 OpenAI 风格接口。',
    language: 'Go',
    license: 'Apache-2.0',
  },
  {
    name: 'Paizer-Open-source-instant-messenger',
    title: 'Paizer',
    tagline: 'Go 编写的开源即时通讯',
    copy: '一个服务端同时承载终端 TCP 客户端和浏览器 WebSocket 客户端，两边的用户可以直接互相聊天。',
    language: 'Go',
    license: 'MIT',
  },
  {
    name: 'Sim6502',
    title: 'Sim6502',
    tagline: '兼容 Apple I 的 6502 模拟器',
    copy: '用 C 模拟经典 6502 处理器与一台 Apple I 兼容机器。',
    language: 'C',
  },
];

// The organization as a stack, from the first instruction to user applications.
export const STACK_LAYERS = [
  { label: '应用与工具', repos: ['Uinxed-Agent', 'Paizer-Open-source-instant-messenger', 'ModLoader', 'GPT-2.0-Model-Training-Kit'] },
  { label: '语言与工具链', repos: ['Uinx'] },
  { label: '模拟与教学', repos: ['PySpOS', 'Sim6502'] },
  { label: '内核', repos: ['Uinxed-Kernel', 'SpaceKernel'] },
  { label: '固件', repos: ['ApexBIOS'] },
];

export const PRINCIPLES = [
  ['从零构建', '不满足于调用现成的接口。调度器、分配器、编译器后端，都尽量自己写一遍。'],
  ['读懂每一层', '固件、内核、语言、应用，每个项目都是理解计算机某一层的一次练习。'],
  ['在公开处协作', '代码、Issue、讨论与 Review 都在 GitHub 上进行，任何人都可以看到并参与。'],
  ['如实标注状态', '实验性的就写实验性。README 里会写清楚哪些功能还在验证、哪些还不安全。'],
];

export const MEMBERS = [
  { login: 'FengHeting' },
  { login: 'Rainy101112' },
  { login: 'JiTianYu391' },
];

// Recent milestones as stated by each project's README.
export const RECENT_NOTES = [
  ['Uinxed-Kernel', '开发镜像可以启动 Alpine Linux 3.23，并运行 Xfce（X11）桌面与终端。'],
  ['Uinx', '发布 0.3.0：所有权检查器大幅增强，stage-0 编译器以 C++20 实现。'],
  ['Uinxed-Agent', '2.0 版本用纯 Go 重写，取代早期的 Node.js + React Ink 实现。'],
  ['PySpOS', '3.2.0 迁入 ViudiraTech 组织，成为唯一活跃的源码仓库。'],
];

export const CONTRIBUTION_WAYS = [
  ['报告问题', '在对应仓库提交 Issue，附上复现步骤、运行环境和日志。'],
  ['提交代码', 'Fork 仓库，在分支上修改，通过 Pull Request 提交并参与 Review。'],
  ['改进文档', '补充构建说明、调试经验或设计文档，让下一个人少走弯路。'],
  ['测试与反馈', '在 QEMU 或真机上运行，把结果和发现反馈给维护者。'],
];

export const STARTING_POINTS = [
  ['想学操作系统原理', 'PySpOS', '用 Python 阅读调度、进程与文件系统的实现，门槛最低。'],
  ['想写内核代码', 'Uinxed-Kernel', '从驱动、文件系统或系统调用中挑一个模块深入。'],
  ['对编译器感兴趣', 'Uinx', '前端、MIR、所有权检查与 LLVM 后端都在演进中。'],
  ['偏好应用与工具', 'Uinxed-Agent', 'Go 编写的终端工具，适合从功能与体验入手。'],
];
