/**
 * Project archive — the single source of truth for both Home and /projects.
 *
 * Adding a project never requires touching any component: fill in the fields
 * below and it appears in the archive automatically.
 *
 * Keep it minimal — this file is data, not presentation. Anything the UI needs
 * to decide *how* to render belongs in the component instead.
 */

export type ProjectStatus = 'In progress' | 'Maintained' | 'Archived' | 'Experiment'

/** Long-form body of /projects/<slug>. Every section is optional. */
export interface ProjectDetail {
  overview: string[]
  architecture?: string[]
  technical?: string[]
  challenges?: string[]
  learned?: string[]
}

export interface Project {
  /** Used as the URL segment: /projects/<slug>. Must be unique. */
  slug: string
  name: string
  /** One line. Shown under the name in every list row. */
  description: string
  tech: string[]
  year: string
  status: ProjectStatus
  /** Featured projects surface on the Home page. */
  featured: boolean
  github?: string
  demo?: string
  detail?: ProjectDetail
}

export const projects: Project[] = [
  {
    slug: 'linux-performance-monitor',
    name: 'Linux Performance Monitor',
    description:
      'A push-based distributed monitoring system: kernel module plus mmap zero-copy sampling, eBPF TC hooks for per-NIC traffic, gRPC and HTTP services behind a Qt6 dashboard.',
    tech: ['C++', 'eBPF', 'gRPC', 'Qt6'],
    year: '2026',
    status: 'Maintained',
    featured: true,
    github: 'https://github.com/LiiVon/perf_monitor',
    detail: {
      overview: [
        '一套面向 Linux 主机的分布式性能监控系统。目标是回答一个很朴素的问题：当一台机器开始变慢的时候，我能不能在几秒内知道是 CPU、内存、磁盘、网络里的哪一个先出了问题。',
        '采集端是一个内核模块 + 用户态守护进程的组合，上报走 gRPC 流式推送而不是轮询拉取；聚合端把数据落库并暴露 HTTP 查询接口；最上层是一个 Qt6 写的桌面仪表盘，负责实时曲线与告警。',
      ],
      architecture: [
        '采集层：内核模块负责 /proc 之外拿不到的细粒度指标（软中断分布、每网卡收发包），通过 mmap 把环形缓冲区直接映射到用户态，避免每次采样都做一次 copy_to_user。',
        '网络层：eBPF 程序挂在 TC ingress / egress 钩子上，按网卡统计流量，绕开 libpcap 的抓包开销。',
        '传输层：Agent 主动向 Collector 推送，protobuf 序列化，长连接复用；Collector 侧做聚合后再写入存储。',
        '展示层：Qt6 Client 走 HTTP 拉取历史数据渲染曲线，同时订阅推送通道做实时刷新。',
      ],
      technical: [
        'mmap 零拷贝环形缓冲：内核态写、用户态读，用读写指针 + 内存屏障做无锁同步，避免在高采样频率下把 CPU 全花在拷贝上。',
        'protobuf 编解码：所有上报消息统一定义为 .proto，跨语言（C++ Agent / 后续可能的 Go 组件）复用同一份 schema。',
        'Reactor 网络模型：Collector 用 epoll 做多路复用，配合定长 + 变长帧解码器处理 TCP 粘包。',
        '连接池与异步日志：数据库访问走 RAII 连接池；日志异步落盘，不阻塞采集主循环。',
      ],
      challenges: [
        '内核态稳定性是最大的约束：环形缓冲区一旦因为用户态消费不及时而写满，丢数据还是阻塞生产者，两难。最后的取舍是允许丢最旧的样本，并记录丢弃计数——监控宁可少一个点，也不能拖慢被监控的机器。',
        'eBPF 校验器对循环和复杂逻辑极其敏感，最初版本因为一处边界判断被拒绝加载。把 per-NIC 统计改成 map 查找后才通过校验。',
        'Qt6 主线程阻塞：早期在 UI 线程里做 HTTP 轮询，网络抖动时整个界面会卡住。改为后台线程拉取 + 信号槽投递到主线程渲染。',
      ],
      learned: [
        '零拷贝不是免费午餐：mmap 省掉的是拷贝开销，换来的是同步复杂度。真正难的从来不是映射内存，而是证明读写指针不会撕裂。',
        'observability 系统的第一性原理是「观测行为本身必须比被观测对象轻一个数量级」，否则你测到的是你自己。',
        'protobuf 的价值不在序列化快，而在 schema 成为契约——团队协作时这份契约比性能重要得多。',
      ],
    },
  },
  {
    slug: 'light-reactor',
    name: 'Light Reactor',
    description:
      'A master-slave Reactor TCP framework for Linux and Windows: epoll / WSPoll multiplexing, length-frame codecs, timer wheels and asynchronous logging.',
    tech: ['C++17', 'epoll', 'CMake'],
    year: '2026',
    status: 'Maintained',
    featured: true,
    github: 'https://github.com/LiiVon/Cpp--Reactor-Framework',
    detail: {
      overview: [
        '一个用现代 C++17 从零写的 Reactor 网络框架，同时在 Linux（epoll）和 Windows（WSPoll 抽象层）上跑通。写它的起因是读完 muduo 之后想确认一件事：那些设计取舍我自己能不能重新推导一遍。',
        '框架本身不负责任何业务逻辑，只提供事件循环、连接管理、编解码、定时器与日志这五件事，业务方注册回调即可。',
      ],
      architecture: [
        'Main Reactor 单独跑在一个线程里，只负责 accept 新连接；拿到连接后按 Round-Robin 派发给某个 Sub Reactor。',
        '每个 Sub Reactor 一个线程一个 EventLoop，各自持有一个 epoll 实例，负责自己名下所有连接的读写事件。连接一旦归属某个 Loop，生命周期内不再迁移——这样绝大多数情况下不需要加锁。',
        '跨线程唤醒靠 eventfd：其他线程投递任务时写入 eventfd，目标 Loop 在自己的 epoll 等待中被唤醒后执行任务队列。',
        'Linux 与 Windows 的差异全部收敛到一个 Poller 抽象接口后面，上层代码零平台分支。',
      ],
      technical: [
        '定长帧解码：协议头固定长度先把包体长度读出来，再按需读取剩余字节，从根本上解决 TCP 粘包拆包，而不是靠分隔符猜。',
        '非阻塞写缓冲：发送不直接 write，先进应用层输出缓冲；只在 socket 可写且缓冲非空时才冲刷，并对 EAGAIN 做正确退让。',
        '时间轮定时器：O(1) 插入与到期检查，替代每次循环遍历一遍所有定时任务的朴素做法。',
        '异步日志：双缓冲队列，前台线程只做格式化和入队，后台线程负责真正落盘，避免磁盘抖动拖慢事件循环。',
        '优雅关闭：连接引用计数 + 状态机，保证析构时既不丢未发送完的数据，也不会 use-after-free。',
      ],
      challenges: [
        '对象生命周期是 Reactor 里最难的部分。连接可能在任意时刻被对端关闭，而此刻事件循环里可能正持有它的裸指针。最后用 shared_ptr 管理连接、回调里传弱引用兜底，并在析构路径上严格区分「主动关闭」和「被动关闭」。',
        '跨平台抽象踩过一次坑：Windows 下 WSPoll 与 select 的行为边界不一致，抽象层如果照搬 epoll 语义会失真。改成只暴露「注册 / 等待 / 返回就绪列表」最小接口后才干净。',
        '一开始为了「性能」把业务回调设计成裸函数指针，写完发现可读性和可测试性都很差，改回 std::function 后每秒请求数几乎没有下降——过早优化的典型反例。',
      ],
      learned: [
        '理解一个框架的最好方式是把它重写一遍：读 muduo 时觉得理所当然的设计，自己写的时候全是一次次权衡。',
        '「一个 Loop 一个线程」的真正价值不是并行，而是把锁从代码里删掉。',
        '优雅关闭不是一个函数，是一条贯穿整个生命周期的状态机。能优雅关机的系统，才是真的理解了资源管理。',
      ],
    },
  },
  {
    slug: 'miniorm',
    name: 'MiniORM',
    description:
      'A small C++20 ORM: chainable query builder, entity mapping driven by reflection metadata, RAII connection pool and transactions over a native MySQL driver.',
    tech: ['C++20', 'MySQL', 'CMake'],
    year: '2026',
    status: 'Archived',
    featured: true,
    github: 'https://github.com/LiiVon/MiniORM',
    detail: {
      overview: [
        '一个不到两千行的 C++20 ORM。动机很直接：想弄清楚 Java 里注解驱动的实体映射，在没有反射的语言里该怎么做。',
        '没有宏魔法黑箱，也不追求覆盖 SQL 全集——只做最常用的增删改查、链式条件构造、事务和连接池，目标是代码读得懂。',
      ],
      architecture: [
        '元数据层：用一套轻量宏把「字段 → 列名、字段 → 类型」登记到编译期可查的表里，模拟反射元数据。',
        '表达式层：链式查询构造器积累条件节点，最终一次性序列化成 SQL 字符串与绑定参数列表。',
        '连接层：RAII 连接池，借出即构造、析构即归还，异常路径也不会泄漏连接。',
        '映射层：拿到结果集后按元数据逐列回填到对象字段，类型转换失败时给出明确错误而不是静默截断。',
      ],
      technical: [
        '链式 API：每个条件方法返回自身引用，条件以 AST 形式暂存，最后统一编译成 WHERE 子句，而不是每一步都拼字符串。',
        '参数绑定：所有用户数据都以预处理语句的参数形式下发，从根上避免 SQL 注入，顺带解决转义问题。',
        'RAII 连接池：Guard 对象在栈上持有连接，作用域结束或抛异常时自动归还。',
        '事务作用域：Begin / Commit / Rollback 包在一个 Transaction 对象里，析构时若未提交则自动回滚。',
      ],
      challenges: [
        'C++ 没有语言级反射，最大的取舍就是宏写到什么程度。写多了就是黑箱，写少了就要求用户手写大量样板。最后把宏收敛到一行 REGISTER 声明。',
        '类型系统的边界很难处理：MySQL 的 DATETIME、DECIMAL、NULL 映射到 C++ 都不是一一对应。NULL 尤其麻烦，逼着我引入了 optional 语义。',
        '拼接 SQL 时最初的写法存在注入风险，意识到之后整个重写为参数绑定版本——这是这个项目里最有价值的一次返工。',
      ],
      learned: [
        'ORM 的本质困难不是生成 SQL，而是在两种类型系统之间做「有损但有明确定义」的翻译。',
        'RAII 让错误处理的代码几乎消失：不是因为我处理得好，而是因为析构函数替我处理了。',
        '没有反射的语言里，编译期元数据能走多远，取决于你愿意把多少约定写进宏。',
      ],
    },
  },
  {
    slug: 'ai-cloud-storage',
    name: 'AI Cloud Storage',
    description:
      'A FastDFS-backed cloud storage service with semantic search: MD5 instant upload, resumable chunked transfer, shareable image hosting and reference-counted deduplication.',
    tech: ['FastDFS', 'FastCGI', 'FAISS', 'Docker'],
    year: '2026',
    status: 'Archived',
    featured: false,
    github: 'https://github.com/LiiVon/AI_YunCunChu',
    detail: {
      overview: [
        '一个自建网盘服务，底层用 FastDFS 做分布式文件存储，上层用 FastCGI 提供 HTTP 接口。除了常规的上传下载，还挂了一个向量检索模块，可以按语义找图片。',
        '完整的 Docker 化部署，包含 tracker、storage、nginx、应用服务与向量索引组件。',
      ],
      architecture: [
        '存储层：FastDFS 的 tracker 负责调度，storage 节点负责实际落盘并支持横向扩容。',
        '接口层：FastCGI 进程池处理 HTTP 请求，nginx 做反向代理与静态资源直出。',
        '秒传层：上传前先算 MD5，服务端若已存在同哈希文件则直接建立引用，跳过传输。',
        '检索层：图片入库时提取特征向量写入 FAISS 索引，查询时按向量相似度召回。',
      ],
      technical: [
        'MD5 秒传：客户端先传哈希，服务端命中则立即返回，网络开销降到一次往返。',
        '断点续传：大文件分片上传，服务端记录已到达分片的偏移量，断开后从断点继续。',
        '引用计数去重：同一份文件被多个用户引用时只存一份，引用计数归零后才真正删除。',
        'FAISS 向量索引：把图片embedding 后的向量做相似度检索，实现「找相似图」而不是只能按文件名搜。',
      ],
      challenges: [
        '引用计数与删除之间的竞态是最隐蔽的 bug 来源：两个用户同时删除同一份文件的最后一个引用，会重复触发物理删除。最后用一个原子操作包裹计数递减，而不是先读后写。',
        'FastCGI 进程模型要求每个进程自行管理数据库连接，进程数一多连接池就被打散了，需要在进程数和每进程连接数之间找平衡。',
        '向量索引持久化：FAISS 索引不像数据库那样天然支持增量落盘，早期版本重启后要全量重建，后来改成定期快照 + 增量追加。',
      ],
      learned: [
        '分布式文件系统最难的不是存，而是「什么时候可以安全地删」——去重系统里，删除比写入危险得多。',
        '秒传本质是用哈希换带宽，它成立的前提是哈希冲突的概率远低于磁盘出错的概率。',
        '把 AI 能力挂到传统后端上时，异步化比模型精度更影响体验：入库流程必须和上传流程解耦。',
      ],
    },
  },
]

/** Featured first, then newest first. Powers both the Home snippet and the archive. */
export const sortedProjects: Project[] = [...projects].sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1
  return b.year.localeCompare(a.year)
})

export const featuredProjects = sortedProjects.filter((p) => p.featured)

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}
