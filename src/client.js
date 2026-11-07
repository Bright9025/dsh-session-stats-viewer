window.__ModuleLoader__.load({
  id: '@bright9025/dsh-session-stats-viewer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'session-stats';
    const ROUTE = 'api/session-stats.data';
    const REQUEST_MARKER = 'session-stats-read';

    const CHART_COLORS = {
      input: '#4f7cf7',
      cacheRead: '#22b394',
      cacheWrite: '#f0a63a',
      output: '#8b7cf6',
    };

    const zh = {
      'nav.title': '会话统计',
      'page.title': '会话统计',
      'page.hint': '全部会话的 Token 消耗、成本与运行状态',
      'range.24h': '近 24 小时',
      'range.7d': '近 7 天',
      'range.14d': '近 14 天',
      'range.30d': '近 30 天',
      'range.all': '所有',
      'currency.cny': '人民币',
      'currency.usd': '美元',
      'kpi.tokens': '总 Token 消耗',
      'kpi.tokens.sub': '输入 {input} · 输出 {output}',
      'kpi.cost': '预估成本',
      'kpi.cost.avg': '均价 {value} / {unit} tokens',
      'kpi.sessions': '会话数',
      'kpi.sessions.sub': '平均每会话 {value} tokens',
      'kpi.cache': '缓存命中率',
      'kpi.cache.sub': '缓存读取 {value}',
      'runtime.title': 'DSH 运行状态',
      'runtime.live': '实时 · 5 秒采样',
      'runtime.cores': '{cores} 核 · 负载 {load}',
      'runtime.cpu': 'CPU（DSH 进程）',
      'runtime.cpu.unit': '单核',
      'runtime.cpu.sub': '整机 {machine}% · {cores} 核',
      'runtime.mem': '内存（DSH 进程）',
      'runtime.mem.sub': '堆已用 {value}',
      'runtime.loop': '事件循环 p99',
      'runtime.loop.sub': '平均 {value}',
      'runtime.uptime': '运行时长',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': '每日消耗',
      'daily.sub': '按 token 堆叠 · {range}（{from} 至 {to}）',
      'daily.hourly': '按 token 堆叠 · 近 24 小时',
      'daily.all': '按 token 堆叠 · 全部时间（{from} 至 {to}，共 {days} 天）',
      'legend.input': '输入（未命中）',
      'legend.cacheRead': '缓存读取',
      'legend.cacheWrite': '缓存写入',
      'legend.output': '输出',
      'donut.title': 'Token 构成',
      'ranking.title': '会话消耗排行',
      'ranking.byTokens': '按 Token',
      'ranking.byTime': '按耗时',
      'ranking.byCost': '按金额',
      'ranking.turns': '{turns} 轮',
      'ranking.empty': '这段时间还没有会话用量。',
      'perf.title': '对话性能',
      'perf.avgTurn': '平均每轮耗时',
      'perf.avgTurn.sub': '共 {turns} 轮',
      'perf.ttft': '平均首字延迟',
      'perf.ttft.sub': '轮次开始到首个分片',
      'perf.speed': '输出速度',
      'perf.speed.sub': '流式生成期间',
      'perf.errors': '工具错误率',
      'perf.errors.sub': '{calls} 次调用中 {errors} 次报错',
      'perf.note': '基于日志中的轮次边界与流式时间戳计算。',
      'models.title': '模型花费',
      'models.sub': '{sessions} 个会话 · {tokens} tokens',
      'models.empty': '这段时间还没有模型用量。',
      'state.loading': '正在读取会话记录…',
      'state.error': '无法读取会话统计',
      'state.retry': '重试',
      'state.refreshing': '更新中…',
      'state.empty': '这段时间还没有会话数据。',
      'footer.note': '成本按 Token 单价估算，仅供参考。',
      'updated': '更新于 {time}',
    };

    const en = {
      'nav.title': 'Session statistics',
      'page.title': 'Session statistics',
      'page.hint': 'Token usage, cost, and runtime health across all sessions',
      'range.24h': 'Last 24 hours',
      'range.7d': 'Last 7 days',
      'range.14d': 'Last 14 days',
      'range.30d': 'Last 30 days',
      'range.all': 'All time',
      'currency.cny': 'CNY',
      'currency.usd': 'USD',
      'kpi.tokens': 'Total tokens',
      'kpi.tokens.sub': 'Input {input} · Output {output}',
      'kpi.cost': 'Estimated cost',
      'kpi.cost.avg': 'Avg {value} / {unit} tokens',
      'kpi.sessions': 'Sessions',
      'kpi.sessions.sub': 'About {value} tokens each',
      'kpi.cache': 'Cache hit rate',
      'kpi.cache.sub': 'Cache read {value}',
      'runtime.title': 'DSH runtime',
      'runtime.live': 'Live · sampled every 5 s',
      'runtime.cores': '{cores} cores · load {load}',
      'runtime.cpu': 'CPU (DSH process)',
      'runtime.cpu.unit': 'core',
      'runtime.cpu.sub': 'Machine {machine}% · {cores} cores',
      'runtime.mem': 'Memory (DSH process)',
      'runtime.mem.sub': 'Heap used {value}',
      'runtime.loop': 'Event loop p99',
      'runtime.loop.sub': 'Mean {value}',
      'runtime.uptime': 'Uptime',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': 'Daily usage',
      'daily.sub': 'Stacked by token type · {range} ({from} to {to})',
      'daily.hourly': 'Stacked by token type · last 24 hours',
      'daily.all': 'Stacked by token type · all time ({from} to {to}, {days} days)',
      'legend.input': 'Input (miss)',
      'legend.cacheRead': 'Cache read',
      'legend.cacheWrite': 'Cache write',
      'legend.output': 'Output',
      'donut.title': 'Token mix',
      'ranking.title': 'Top sessions',
      'ranking.byTokens': 'By tokens',
      'ranking.byTime': 'By time',
      'ranking.byCost': 'By cost',
      'ranking.turns': '{turns} turns',
      'ranking.empty': 'No session usage in this period yet.',
      'perf.title': 'Conversation performance',
      'perf.avgTurn': 'Average turn',
      'perf.avgTurn.sub': '{turns} turns',
      'perf.ttft': 'Average first token',
      'perf.ttft.sub': 'Turn start to first chunk',
      'perf.speed': 'Output speed',
      'perf.speed.sub': 'During streaming',
      'perf.errors': 'Tool error rate',
      'perf.errors.sub': '{errors} of {calls} calls failed',
      'perf.note': 'Computed from logged turn boundaries and stream timestamps.',
      'models.title': 'Model spend',
      'models.sub': '{sessions} sessions · {tokens} tokens',
      'models.empty': 'No model usage in this period yet.',
      'state.loading': 'Reading session logs…',
      'state.error': 'Cannot read session statistics',
      'state.retry': 'Retry',
      'state.refreshing': 'Refreshing…',
      'state.empty': 'No session data for this period yet.',
      'footer.note': 'Cost is estimated from token prices and is informational only.',
      'updated': 'Updated {time}',
    };

    const ja = {
      'nav.title': 'セッション統計',
      'page.title': 'セッション統計',
      'page.hint': 'すべてのセッションの Token 使用量、コスト、実行状態',
      'range.24h': '過去 24 時間',
      'range.7d': '過去 7 日間',
      'range.14d': '過去 14 日間',
      'range.30d': '過去 30 日間',
      'range.all': 'すべて',
      'currency.cny': '人民元',
      'currency.usd': '米ドル',
      'kpi.tokens': '総 Token 使用量',
      'kpi.tokens.sub': '入力 {input} · 出力 {output}',
      'kpi.cost': '推定コスト',
      'kpi.cost.avg': '平均 {value} / {unit} tokens',
      'kpi.sessions': 'セッション数',
      'kpi.sessions.sub': '1 セッションあたり平均 {value} tokens',
      'kpi.cache': 'キャッシュヒット率',
      'kpi.cache.sub': 'キャッシュ読み取り {value}',
      'runtime.title': 'DSH 実行状態',
      'runtime.live': 'リアルタイム · 5 秒間隔',
      'runtime.cores': '{cores} コア · 負荷 {load}',
      'runtime.cpu': 'CPU（DSH プロセス）',
      'runtime.cpu.unit': '単一コア',
      'runtime.cpu.sub': 'マシン全体 {machine}% · {cores} コア',
      'runtime.mem': 'メモリ（DSH プロセス）',
      'runtime.mem.sub': 'ヒープ使用量 {value}',
      'runtime.loop': 'イベントループ p99',
      'runtime.loop.sub': '平均 {value}',
      'runtime.uptime': '稼働時間',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': '日別消費',
      'daily.sub': 'Token 別の積み上げ · {range}（{from} 〜 {to}）',
      'daily.hourly': 'Token 別の積み上げ · 過去 24 時間',
      'daily.all': 'Token 別の積み上げ · 全期間（{from} 〜 {to}、{days} 日）',
      'legend.input': '入力（未ヒット）',
      'legend.cacheRead': 'キャッシュ読み取り',
      'legend.cacheWrite': 'キャッシュ書き込み',
      'legend.output': '出力',
      'donut.title': 'Token の内訳',
      'ranking.title': 'セッション消費ランキング',
      'ranking.byTokens': 'Token 順',
      'ranking.byTime': '時間順',
      'ranking.byCost': '金額順',
      'ranking.turns': '{turns} ターン',
      'ranking.empty': 'この期間にはまだセッション使用量がありません。',
      'perf.title': '会話パフォーマンス',
      'perf.avgTurn': '平均ターン時間',
      'perf.avgTurn.sub': '全 {turns} ターン',
      'perf.ttft': '平均初回トークン遅延',
      'perf.ttft.sub': 'ターン開始から最初のチャンクまで',
      'perf.speed': '出力速度',
      'perf.speed.sub': 'ストリーミング中',
      'perf.errors': 'ツールエラー率',
      'perf.errors.sub': '{calls} 回中 {errors} 回エラー',
      'perf.note': 'ログのターン境界とストリームのタイムスタンプから算出。',
      'models.title': 'モデル別コスト',
      'models.sub': '{sessions} セッション · {tokens} tokens',
      'models.empty': 'この期間にはまだモデル使用量がありません。',
      'state.loading': 'セッションログを読み込み中…',
      'state.error': 'セッション統計を読み取れません',
      'state.retry': '再試行',
      'state.refreshing': '更新中…',
      'state.empty': 'この期間にはまだセッションがありません。',
      'footer.note': 'コストは Token 単価による推定値であり、参考情報です。',
      'updated': '{time} に更新',
    };

    const es = {
      'nav.title': 'Estadísticas de sesión',
      'page.title': 'Estadísticas de sesión',
      'page.hint': 'Consumo de tokens, coste y estado de todas las sesiones',
      'range.24h': 'Últimas 24 horas',
      'range.7d': 'Últimos 7 días',
      'range.14d': 'Últimos 14 días',
      'range.30d': 'Últimos 30 días',
      'range.all': 'Todo',
      'currency.cny': 'CNY',
      'currency.usd': 'USD',
      'kpi.tokens': 'Tokens totales',
      'kpi.tokens.sub': 'Entrada {input} · Salida {output}',
      'kpi.cost': 'Coste estimado',
      'kpi.cost.avg': 'Precio medio {value} / {unit} tokens',
      'kpi.sessions': 'Sesiones',
      'kpi.sessions.sub': 'Media de {value} tokens por sesión',
      'kpi.cache': 'Tasa de acierto de caché',
      'kpi.cache.sub': 'Lectura de caché {value}',
      'runtime.title': 'Estado de DSH',
      'runtime.live': 'En vivo · muestreo cada 5 s',
      'runtime.cores': '{cores} núcleos · carga {load}',
      'runtime.cpu': 'CPU (proceso DSH)',
      'runtime.cpu.unit': 'un núcleo',
      'runtime.cpu.sub': 'Máquina {machine}% · {cores} núcleos',
      'runtime.mem': 'Memoria (proceso DSH)',
      'runtime.mem.sub': 'Montículo usado {value}',
      'runtime.loop': 'Bucle de eventos p99',
      'runtime.loop.sub': 'Media {value}',
      'runtime.uptime': 'Tiempo activo',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': 'Consumo diario',
      'daily.sub': 'Apilado por tipo de token · {range} ({from} a {to})',
      'daily.hourly': 'Apilado por tipo de token · últimas 24 horas',
      'daily.all': 'Apilado por tipo de token · todo el tiempo ({from} a {to}, {days} días)',
      'legend.input': 'Entrada (sin caché)',
      'legend.cacheRead': 'Lectura de caché',
      'legend.cacheWrite': 'Escritura de caché',
      'legend.output': 'Salida',
      'donut.title': 'Composición de tokens',
      'ranking.title': 'Ranking de sesiones',
      'ranking.byTokens': 'Por tokens',
      'ranking.byTime': 'Por tiempo',
      'ranking.byCost': 'Por coste',
      'ranking.turns': '{turns} turnos',
      'ranking.empty': 'Aún no hay consumo de sesiones en este periodo.',
      'perf.title': 'Rendimiento de conversación',
      'perf.avgTurn': 'Duración media por turno',
      'perf.avgTurn.sub': '{turns} turnos en total',
      'perf.ttft': 'Latencia media del primer token',
      'perf.ttft.sub': 'Del inicio del turno al primer fragmento',
      'perf.speed': 'Velocidad de salida',
      'perf.speed.sub': 'Durante el streaming',
      'perf.errors': 'Tasa de error de herramientas',
      'perf.errors.sub': '{errors} de {calls} llamadas fallaron',
      'perf.note': 'Calculado a partir de los límites de turno y las marcas de tiempo del stream.',
      'models.title': 'Gasto por modelo',
      'models.sub': '{sessions} sesiones · {tokens} tokens',
      'models.empty': 'Aún no hay uso de modelos en este periodo.',
      'state.loading': 'Leyendo registros de sesión…',
      'state.error': 'No se pueden leer las estadísticas de sesión',
      'state.retry': 'Reintentar',
      'state.refreshing': 'Actualizando…',
      'state.empty': 'Aún no hay datos de sesión en este periodo.',
      'footer.note': 'El coste es una estimación según los precios por token; solo orientativo.',
      'updated': 'Actualizado {time}',
    };

    const fr = {
      'nav.title': 'Statistiques de session',
      'page.title': 'Statistiques de session',
      'page.hint': 'Consommation de tokens, coût et état de toutes les sessions',
      'range.24h': 'Dernières 24 heures',
      'range.7d': '7 derniers jours',
      'range.14d': '14 derniers jours',
      'range.30d': '30 derniers jours',
      'range.all': 'Tout',
      'currency.cny': 'CNY',
      'currency.usd': 'USD',
      'kpi.tokens': 'Tokens totaux',
      'kpi.tokens.sub': 'Entrée {input} · Sortie {output}',
      'kpi.cost': 'Coût estimé',
      'kpi.cost.avg': 'Prix moyen {value} / {unit} tokens',
      'kpi.sessions': 'Sessions',
      'kpi.sessions.sub': 'Environ {value} tokens par session',
      'kpi.cache': 'Taux de cache',
      'kpi.cache.sub': 'Lecture du cache {value}',
      'runtime.title': 'État de DSH',
      'runtime.live': 'En direct · échantillonné toutes les 5 s',
      'runtime.cores': '{cores} cœurs · charge {load}',
      'runtime.cpu': 'CPU (processus DSH)',
      'runtime.cpu.unit': 'un cœur',
      'runtime.cpu.sub': 'Machine {machine} % · {cores} cœurs',
      'runtime.mem': 'Mémoire (processus DSH)',
      'runtime.mem.sub': 'Tas utilisé {value}',
      'runtime.loop': 'Boucle événementielle p99',
      'runtime.loop.sub': 'Moyenne {value}',
      'runtime.uptime': 'Durée de fonctionnement',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': 'Consommation quotidienne',
      'daily.sub': 'Empilé par type de token · {range} ({from} à {to})',
      'daily.hourly': 'Empilé par type de token · dernières 24 heures',
      'daily.all': 'Empilé par type de token · tout l’historique ({from} à {to}, {days} jours)',
      'legend.input': 'Entrée (non mise en cache)',
      'legend.cacheRead': 'Lecture du cache',
      'legend.cacheWrite': 'Écriture du cache',
      'legend.output': 'Sortie',
      'donut.title': 'Répartition des tokens',
      'ranking.title': 'Classement des sessions',
      'ranking.byTokens': 'Par tokens',
      'ranking.byTime': 'Par durée',
      'ranking.byCost': 'Par coût',
      'ranking.turns': '{turns} tours',
      'ranking.empty': 'Aucune consommation de session sur cette période.',
      'perf.title': 'Performances de conversation',
      'perf.avgTurn': 'Durée moyenne par tour',
      'perf.avgTurn.sub': '{turns} tours au total',
      'perf.ttft': 'Latence moyenne du premier token',
      'perf.ttft.sub': 'Du début du tour au premier fragment',
      'perf.speed': 'Vitesse de sortie',
      'perf.speed.sub': 'Pendant le streaming',
      'perf.errors': 'Taux d’erreur des outils',
      'perf.errors.sub': '{errors} échecs sur {calls} appels',
      'perf.note': 'Calculé à partir des limites de tour et des horodatages du flux.',
      'models.title': 'Dépense par modèle',
      'models.sub': '{sessions} sessions · {tokens} tokens',
      'models.empty': 'Aucune utilisation de modèle sur cette période.',
      'state.loading': 'Lecture des journaux de session…',
      'state.error': 'Impossible de lire les statistiques de session',
      'state.retry': 'Réessayer',
      'state.refreshing': 'Actualisation…',
      'state.empty': 'Aucune donnée de session sur cette période.',
      'footer.note': 'Le coût est une estimation basée sur le prix des tokens, à titre indicatif.',
      'updated': 'Mis à jour {time}',
    };

    const de = {
      'nav.title': 'Sitzungsstatistik',
      'page.title': 'Sitzungsstatistik',
      'page.hint': 'Token-Verbrauch, Kosten und Laufzeitstatus aller Sitzungen',
      'range.24h': 'Letzte 24 Stunden',
      'range.7d': 'Letzte 7 Tage',
      'range.14d': 'Letzte 14 Tage',
      'range.30d': 'Letzte 30 Tage',
      'range.all': 'Gesamt',
      'currency.cny': 'CNY',
      'currency.usd': 'USD',
      'kpi.tokens': 'Token gesamt',
      'kpi.tokens.sub': 'Eingabe {input} · Ausgabe {output}',
      'kpi.cost': 'Geschätzte Kosten',
      'kpi.cost.avg': 'Durchschnitt {value} / {unit} tokens',
      'kpi.sessions': 'Sitzungen',
      'kpi.sessions.sub': 'Etwa {value} tokens pro Sitzung',
      'kpi.cache': 'Cache-Trefferquote',
      'kpi.cache.sub': 'Cache-Lesevorgänge {value}',
      'runtime.title': 'DSH-Laufzeit',
      'runtime.live': 'Live · alle 5 s erfasst',
      'runtime.cores': '{cores} Kerne · Last {load}',
      'runtime.cpu': 'CPU (DSH-Prozess)',
      'runtime.cpu.unit': 'ein Kern',
      'runtime.cpu.sub': 'Gesamtsystem {machine} % · {cores} Kerne',
      'runtime.mem': 'Speicher (DSH-Prozess)',
      'runtime.mem.sub': 'Heap belegt {value}',
      'runtime.loop': 'Event-Loop p99',
      'runtime.loop.sub': 'Mittel {value}',
      'runtime.uptime': 'Laufzeit',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': 'Täglicher Verbrauch',
      'daily.sub': 'Gestapelt nach Token-Art · {range} ({from} bis {to})',
      'daily.hourly': 'Gestapelt nach Token-Art · letzte 24 Stunden',
      'daily.all': 'Gestapelt nach Token-Art · gesamter Zeitraum ({from} bis {to}, {days} Tage)',
      'legend.input': 'Eingabe (ohne Cache)',
      'legend.cacheRead': 'Cache-Lesen',
      'legend.cacheWrite': 'Cache-Schreiben',
      'legend.output': 'Ausgabe',
      'donut.title': 'Token-Zusammensetzung',
      'ranking.title': 'Sitzungsranking',
      'ranking.byTokens': 'Nach Tokens',
      'ranking.byTime': 'Nach Dauer',
      'ranking.byCost': 'Nach Kosten',
      'ranking.turns': '{turns} Runden',
      'ranking.empty': 'In diesem Zeitraum gibt es noch keinen Sitzungsverbrauch.',
      'perf.title': 'Gesprächsleistung',
      'perf.avgTurn': 'Durchschnittliche Rundendauer',
      'perf.avgTurn.sub': '{turns} Runden insgesamt',
      'perf.ttft': 'Durchschnittliche Latenz des ersten Tokens',
      'perf.ttft.sub': 'Vom Rundenstart bis zum ersten Chunk',
      'perf.speed': 'Ausgabegeschwindigkeit',
      'perf.speed.sub': 'Während des Streamings',
      'perf.errors': 'Werkzeugfehlerrate',
      'perf.errors.sub': '{errors} von {calls} Aufrufen fehlgeschlagen',
      'perf.note': 'Berechnet aus Runden-Grenzen und Stream-Zeitstempeln.',
      'models.title': 'Kosten pro Modell',
      'models.sub': '{sessions} Sitzungen · {tokens} tokens',
      'models.empty': 'In diesem Zeitraum gibt es noch keine Modellnutzung.',
      'state.loading': 'Sitzungsprotokolle werden gelesen…',
      'state.error': 'Sitzungsstatistik kann nicht gelesen werden',
      'state.retry': 'Erneut versuchen',
      'state.refreshing': 'Aktualisieren…',
      'state.empty': 'In diesem Zeitraum gibt es noch keine Sitzungsdaten.',
      'footer.note': 'Die Kosten sind eine Schätzung anhand der Token-Preise und nur zur Orientierung.',
      'updated': 'Aktualisiert {time}',
    };

    const ru = {
      'nav.title': 'Статистика сессий',
      'page.title': 'Статистика сессий',
      'page.hint': 'Расход токенов, стоимость и состояние всех сессий',
      'range.24h': 'Последние 24 часа',
      'range.7d': 'Последние 7 дней',
      'range.14d': 'Последние 14 дней',
      'range.30d': 'Последние 30 дней',
      'range.all': 'Все время',
      'currency.cny': 'CNY',
      'currency.usd': 'USD',
      'kpi.tokens': 'Всего токенов',
      'kpi.tokens.sub': 'Ввод {input} · вывод {output}',
      'kpi.cost': 'Оценка стоимости',
      'kpi.cost.avg': 'Средняя цена {value} / {unit} tokens',
      'kpi.sessions': 'Сессии',
      'kpi.sessions.sub': 'В среднем {value} tokens на сессию',
      'kpi.cache': 'Доля попаданий в кэш',
      'kpi.cache.sub': 'Чтение кэша {value}',
      'runtime.title': 'Состояние DSH',
      'runtime.live': 'Реальное время · выборка каждые 5 с',
      'runtime.cores': '{cores} ядер · нагрузка {load}',
      'runtime.cpu': 'CPU (процесс DSH)',
      'runtime.cpu.unit': 'одно ядро',
      'runtime.cpu.sub': 'Вся машина {machine}% · {cores} ядер',
      'runtime.mem': 'Память (процесс DSH)',
      'runtime.mem.sub': 'Занято в куче {value}',
      'runtime.loop': 'Цикл событий p99',
      'runtime.loop.sub': 'В среднем {value}',
      'runtime.uptime': 'Время работы',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': 'Суточный расход',
      'daily.sub': 'С накоплением по типам токенов · {range} ({from} — {to})',
      'daily.hourly': 'С накоплением по типам токенов · последние 24 часа',
      'daily.all': 'С накоплением по типам токенов · все время ({from} — {to}, {days} дн.)',
      'legend.input': 'Ввод (без кэша)',
      'legend.cacheRead': 'Чтение кэша',
      'legend.cacheWrite': 'Запись кэша',
      'legend.output': 'Вывод',
      'donut.title': 'Состав токенов',
      'ranking.title': 'Рейтинг сессий',
      'ranking.byTokens': 'По токенам',
      'ranking.byTime': 'По времени',
      'ranking.byCost': 'По стоимости',
      'ranking.turns': '{turns} ходов',
      'ranking.empty': 'За этот период расхода по сессиям еще нет.',
      'perf.title': 'Производительность диалога',
      'perf.avgTurn': 'Средняя длительность хода',
      'perf.avgTurn.sub': 'Всего {turns} ходов',
      'perf.ttft': 'Средняя задержка первого токена',
      'perf.ttft.sub': 'От начала хода до первого фрагмента',
      'perf.speed': 'Скорость вывода',
      'perf.speed.sub': 'Во время потоковой генерации',
      'perf.errors': 'Доля ошибок инструментов',
      'perf.errors.sub': '{errors} из {calls} вызовов с ошибкой',
      'perf.note': 'Рассчитано по границам ходов и меткам времени потока.',
      'models.title': 'Расход по моделям',
      'models.sub': '{sessions} сессий · {tokens} tokens',
      'models.empty': 'За этот период использования моделей еще нет.',
      'state.loading': 'Чтение журналов сессий…',
      'state.error': 'Не удалось прочитать статистику сессий',
      'state.retry': 'Повторить',
      'state.refreshing': 'Обновление…',
      'state.empty': 'За этот период данных о сессиях еще нет.',
      'footer.note': 'Стоимость оценена по цене токенов и носит справочный характер.',
      'updated': 'Обновлено {time}',
    };

    const pt = {
      'nav.title': 'Estatísticas de sessão',
      'page.title': 'Estatísticas de sessão',
      'page.hint': 'Uso de tokens, custo e saúde de todas as sessões',
      'range.24h': 'Últimas 24 horas',
      'range.7d': 'Últimos 7 dias',
      'range.14d': 'Últimos 14 dias',
      'range.30d': 'Últimos 30 dias',
      'range.all': 'Tudo',
      'currency.cny': 'CNY',
      'currency.usd': 'USD',
      'kpi.tokens': 'Tokens totais',
      'kpi.tokens.sub': 'Entrada {input} · Saída {output}',
      'kpi.cost': 'Custo estimado',
      'kpi.cost.avg': 'Preço médio {value} / {unit} tokens',
      'kpi.sessions': 'Sessões',
      'kpi.sessions.sub': 'Cerca de {value} tokens por sessão',
      'kpi.cache': 'Taxa de acerto do cache',
      'kpi.cache.sub': 'Leitura de cache {value}',
      'runtime.title': 'Estado do DSH',
      'runtime.live': 'Ao vivo · amostrado a cada 5 s',
      'runtime.cores': '{cores} núcleos · carga {load}',
      'runtime.cpu': 'CPU (processo DSH)',
      'runtime.cpu.unit': 'um núcleo',
      'runtime.cpu.sub': 'Máquina {machine}% · {cores} núcleos',
      'runtime.mem': 'Memória (processo DSH)',
      'runtime.mem.sub': 'Heap usado {value}',
      'runtime.loop': 'Event loop p99',
      'runtime.loop.sub': 'Média {value}',
      'runtime.uptime': 'Tempo de atividade',
      'runtime.uptime.sub': 'PID {pid} · Node {node}',
      'daily.title': 'Consumo diário',
      'daily.sub': 'Empilhado por tipo de token · {range} ({from} a {to})',
      'daily.hourly': 'Empilhado por tipo de token · últimas 24 horas',
      'daily.all': 'Empilhado por tipo de token · todo o período ({from} a {to}, {days} dias)',
      'legend.input': 'Entrada (sem cache)',
      'legend.cacheRead': 'Leitura de cache',
      'legend.cacheWrite': 'Escrita de cache',
      'legend.output': 'Saída',
      'donut.title': 'Composição de tokens',
      'ranking.title': 'Ranking de sessões',
      'ranking.byTokens': 'Por tokens',
      'ranking.byTime': 'Por tempo',
      'ranking.byCost': 'Por custo',
      'ranking.turns': '{turns} turnos',
      'ranking.empty': 'Ainda não há consumo de sessões neste período.',
      'perf.title': 'Desempenho da conversa',
      'perf.avgTurn': 'Duração média por turno',
      'perf.avgTurn.sub': '{turns} turnos no total',
      'perf.ttft': 'Latência média do primeiro token',
      'perf.ttft.sub': 'Do início do turno ao primeiro trecho',
      'perf.speed': 'Velocidade de saída',
      'perf.speed.sub': 'Durante o streaming',
      'perf.errors': 'Taxa de erro de ferramentas',
      'perf.errors.sub': '{errors} de {calls} chamadas falharam',
      'perf.note': 'Calculado a partir dos limites de turno e dos carimbos de tempo do stream.',
      'models.title': 'Gasto por modelo',
      'models.sub': '{sessions} sessões · {tokens} tokens',
      'models.empty': 'Ainda não há uso de modelos neste período.',
      'state.loading': 'Lendo registros de sessão…',
      'state.error': 'Não foi possível ler as estatísticas de sessão',
      'state.retry': 'Tentar novamente',
      'state.refreshing': 'Atualizando…',
      'state.empty': 'Ainda não há dados de sessão neste período.',
      'footer.note': 'O custo é uma estimativa com base nos preços dos tokens e serve apenas como referência.',
      'updated': 'Atualizado {time}',
    };

    const CSS = `
.dss-page{box-sizing:border-box;height:100%;display:flex;flex-direction:column;align-items:center;padding:0 clamp(24px,4vw,48px);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}
.dss-head{width:100%;max-width:1040px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:28px 0 16px;flex:none}
.dss-head-main{min-width:0}
.dss-title{margin:0;font-size:20px;line-height:28px;font-weight:600;letter-spacing:.01em}
.dss-sub{margin:3px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dss-controls{display:flex;align-items:center;gap:6px;flex:none;padding-top:2px}
.dss-sep{width:1px;height:18px;background:var(--dsw-alias-border-l1);margin:0 6px}
.dss-tabs{display:inline-flex;align-items:center;gap:2px}
.dss-tab{box-sizing:border-box;height:28px;padding:0 10px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dss-tab:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);color:var(--dsw-alias-label-primary)}
.dss-tab[aria-pressed="true"]{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary);font-weight:500}
.dss-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dss-body{width:100%;max-width:1040px;flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:1px 0 44px}
.dss-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.dss-row{display:grid;grid-template-columns:minmax(0,1.85fr) minmax(0,1fr);gap:14px;align-items:stretch}
.dss-stack{display:flex;flex-direction:column;gap:14px;min-width:0}
.dss-card{box-sizing:border-box;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);border-radius:14px;padding:18px 20px;min-width:0}
.dss-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.dss-card-head-main{min-width:0}
.dss-card-title{font-size:14px;line-height:20px;font-weight:600;margin:0}
.dss-card-note{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary);margin:2px 0 0}
.dss-card-side{flex:none;text-align:right;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dss-card-side strong{display:block;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dss-kpi{display:flex;flex-direction:column;gap:9px}
.dss-kpi-top{display:flex;align-items:center;gap:7px;min-width:0}
.dss-kpi-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px}
.dss-kpi-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dss-kpi-value{display:flex;align-items:baseline;gap:4px;font-size:27px;line-height:33px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}
.dss-kpi-unit{font-size:12px;font-weight:400;letter-spacing:0;color:var(--dsw-alias-label-secondary)}
.dss-kpi-sub{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dss-live{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:2px 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent);color:var(--dsw-alias-state-success-primary);font-size:10.5px;line-height:15px;font-weight:500;white-space:nowrap}
.dss-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:currentColor;flex:none}
.dss-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 16px;margin-bottom:0}
.dss-metric-label{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dss-metric-value{display:flex;align-items:baseline;gap:4px;font-size:21px;line-height:27px;font-weight:600;margin-top:2px;white-space:nowrap}
.dss-metric-value small{font-size:11px;font-weight:400;color:var(--dsw-alias-label-secondary);letter-spacing:0}
.dss-metric-sub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.dss-bars{display:flex;align-items:flex-end;gap:clamp(6px,.9vw,14px);height:176px;margin-top:4px;position:relative;padding:0 16px;box-sizing:border-box}
.dss-bar-col{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%;position:relative;cursor:default}
.dss-bar-track{flex:1;display:flex;align-items:flex-end;justify-content:center;min-height:0}
.dss-bar-stack{width:100%;max-width:34px;display:flex;flex-direction:column-reverse;border-radius:4px 4px 3px 3px;overflow:hidden;min-height:2px;transition:height .18s ease}
.dss-bar-seg{width:100%;min-height:0}
.dss-bar-label{flex:none;text-align:center;font-size:10.5px;line-height:16px;color:var(--dsw-alias-label-secondary);margin-top:7px;white-space:nowrap;overflow:visible;min-height:16px}
.dss-bar-label-first{text-align:left}
.dss-bar-label-last{text-align:right}
.dss-bar-col:hover .dss-bar-stack{filter:brightness(1.06)}
.dss-tip{position:absolute;z-index:5;top:0;transform:translateX(-50%);min-width:132px;max-width:220px;padding:9px 11px;border-radius:9px;background:var(--dsw-alias-bg-overlay);box-shadow:0 6px 20px rgba(0,0,0,.16);border:.5px solid var(--dsw-alias-border-l1);pointer-events:none}
.dss-tip-title{font-size:11px;color:var(--dsw-alias-label-secondary);margin-bottom:4px}
.dss-tip-total{font-size:13px;font-weight:600;margin-bottom:5px}
.dss-tip-row{display:flex;align-items:center;gap:6px;font-size:11px;line-height:16px;white-space:nowrap}
.dss-tip-row span:last-child{margin-left:auto;padding-left:10px;color:var(--dsw-alias-label-primary)}
.dss-legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;margin-top:14px}
.dss-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dss-swatch{width:7px;height:7px;border-radius:2px;flex:none}
.dss-donut-wrap{display:flex;flex-direction:column;align-items:center;gap:14px}
.dss-donut{position:relative;width:168px;height:168px}
.dss-donut svg{display:block;width:100%;height:100%}
.dss-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.dss-donut-total{font-size:21px;line-height:26px;font-weight:600;letter-spacing:-.01em}
.dss-donut-unit{font-size:10.5px;line-height:14px;color:var(--dsw-alias-label-secondary)}
.dss-donut-cost{font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.dss-donut-legend{width:100%;display:flex;flex-direction:column;gap:2px}
.dss-donut-row{display:flex;align-items:center;gap:7px;padding:4px 2px;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.dss-donut-row .dss-swatch{width:6px;height:6px;border-radius:2px}
.dss-donut-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dss-donut-value{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.dss-donut-pct{width:44px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
.dss-rank-list{display:flex;flex-direction:column}
.dss-rank{display:flex;align-items:center;gap:10px;padding:9px 6px;border:none;background:transparent;border-radius:8px;font:inherit;color:inherit;text-align:left;width:100%;cursor:pointer}
.dss-rank:not(:last-child){border-bottom:.5px solid var(--dsw-alias-border-l1);border-radius:0}
.dss-rank:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent)}
.dss-rank:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dss-rank-index{flex:none;display:inline-flex;align-items:center;justify-content:center;width:21px;height:21px;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.dss-rank-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dss-rank-title{font-size:12.5px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dss-rank-meta{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-secondary);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dss-rank-nums{flex:none;text-align:right;display:flex;flex-direction:column;gap:1px}
.dss-rank-tokens{font-size:12.5px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums}
.dss-rank-cost{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.dss-rank-chevron{flex:none;color:var(--dsw-alias-state-idle-primary);display:inline-flex;margin-left:2px}
.dss-perf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 14px}
.dss-perf-label{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.dss-perf-value{font-size:20px;line-height:26px;font-weight:600;margin-top:2px;white-space:nowrap}
.dss-perf-sub{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-secondary);margin-top:1px}
.dss-perf-note{font-size:10.5px;line-height:16px;color:var(--dsw-alias-label-secondary);margin-top:14px}
.dss-model{display:flex;flex-direction:column;gap:5px;padding:8px 0}
.dss-model:not(:last-child){border-bottom:.5px solid var(--dsw-alias-border-l1)}
.dss-model-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.dss-model-name{font-size:12.5px;line-height:18px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dss-model-cost{font-size:12.5px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums;flex:none}
.dss-model-bar{height:5px;border-radius:3px;background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent);overflow:hidden}
.dss-model-fill{height:100%;border-radius:3px;background:var(--dsw-alias-brand-primary)}
.dss-model-sub{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-secondary)}
.dss-empty{padding:28px 0;text-align:center;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dss-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:64px 20px;text-align:center}
.dss-state-title{font-size:13px;font-weight:500}
.dss-state-text{font-size:12px;color:var(--dsw-alias-label-secondary);max-width:520px}
.dss-retry{height:30px;padding:0 14px;border:.5px solid var(--dsw-alias-border-l1);border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
.dss-retry:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent)}
.dss-updated{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-secondary);text-align:right;margin-top:4px}
.dss-footer{font-size:10.5px;line-height:16px;color:var(--dsw-alias-label-secondary);text-align:center;padding:2px 0 8px}
@media (max-width:1000px){.dss-row{grid-template-columns:minmax(0,1fr)}.dss-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.dss-grid{grid-template-columns:minmax(0,1fr)}.dss-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.dss-head{flex-direction:column;align-items:stretch}.dss-controls{justify-content:flex-start;flex-wrap:wrap}.dss-perf-grid{grid-template-columns:minmax(0,1fr)}.dss-sub{white-space:normal}}
`;

    function formatTokens(value) {
      const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      if (number <= 0) return '0';
      if (number >= 1e9) return `${trimZeros((number / 1e9).toFixed(2))}B`;
      if (number >= 1e6) return `${trimZeros((number / 1e6).toFixed(number >= 1e7 ? 1 : 2))}M`;
      if (number >= 1e3) return `${trimZeros((number / 1e3).toFixed(1))}K`;
      return String(Math.round(number));
    }

    function trimZeros(text) {
      return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
    }

    function formatBytes(value) {
      const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      if (number >= 1073741824) return `${(number / 1073741824).toFixed(1)} GB`;
      return `${Math.round(number / 1048576)} MB`;
    }

    function formatLatency(value) {
      const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      if (number <= 0) return '—';
      if (number < 1000) return `${Math.round(number)} ms`;
      if (number < 60000) return `${(number / 1000).toFixed(1)} s`;
      return `${Math.floor(number / 60000)}m ${String(Math.round((number % 60000) / 1000)).padStart(2, '0')}s`;
    }

    function formatUptime(value) {
      const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      const seconds = Math.floor(number / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
      return `${Math.floor(hours / 24)}d ${String(hours % 24).padStart(2, '0')}h`;
    }

    function formatSpeed(value) {
      const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      if (number <= 0) return '—';
      return `${number >= 100 ? Math.round(number) : number.toFixed(1)} tok/s`;
    }

    function formatClock(ts) {
      if (typeof ts !== 'number' || !Number.isFinite(ts)) return '';
      const date = new Date(ts);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    }

    function averagePriceUnit(perMillion) {
      const value = typeof perMillion === 'number' && Number.isFinite(perMillion) ? perMillion : 0;
      const units = [1, 10, 100, 1000];
      let unit = 1000;
      for (const candidate of units) {
        if (value * candidate >= 1) {
          unit = candidate;
          break;
        }
      }
      return { value: (value * unit).toFixed(2), unit: unit >= 1000 ? '1B' : `${unit}M` };
    }

    function formatPointTitle(point, bucket) {
      if (point === null || typeof point !== 'object' || typeof point.ts !== 'number' || !Number.isFinite(point.ts)) return '';
      const date = new Date(point.ts);
      const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return bucket === 'hour' ? `${day} ${String(date.getHours()).padStart(2, '0')}:00` : day;
    }

    function formatDay(ts) {
      if (typeof ts !== 'number' || !Number.isFinite(ts)) return '';
      const date = new Date(ts);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function percentOf(part, total) {
      if (!(total > 0) || !(part > 0)) return 0;
      return (part / total) * 100;
    }

    function strokeSvg(children, size) {
      return h('svg', { viewBox: '0 0 16 16', width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }, children);
    }

    function IconStack({ size = 14 }) {
      return strokeSvg([
        h('path', { key: 'a', d: 'M8 2.2 2.4 5.1 8 8l5.6-2.9L8 2.2Z' }),
        h('path', { key: 'b', d: 'M2.4 8 8 10.9 13.6 8' }),
        h('path', { key: 'c', d: 'M2.4 10.9 8 13.8l5.6-2.9' }),
      ], size);
    }

    function IconCost({ size = 14 }) {
      return strokeSvg([
        h('circle', { key: 'a', cx: 8, cy: 8, r: 5.6 }),
        h('path', { key: 'b', d: 'M6.2 5.6 8 7.9l1.8-2.3' }),
        h('path', { key: 'c', d: 'M8 7.9v3.1' }),
        h('path', { key: 'd', d: 'M6.4 9h3.2' }),
      ], size);
    }

    function IconChat({ size = 14 }) {
      return strokeSvg([
        h('path', { key: 'a', d: 'M2.6 3.4h10.8v6.4H7.2L4.4 12V9.8H2.6Z' }),
        h('path', { key: 'b', d: 'M5.2 6h5.6' }),
        h('path', { key: 'c', d: 'M5.2 7.8h3.4' }),
      ], size);
    }

    function IconBolt({ size = 14 }) {
      return strokeSvg([h('path', { key: 'a', d: 'M9 1.8 3.8 9h3.6l-.6 5.2L12.2 7H8.6Z' })], size);
    }

    function IconChevron({ size = 14 }) {
      return strokeSvg([h('path', { key: 'a', d: 'M6.2 3.5 10.7 8l-4.5 4.5' })], size);
    }

    function Segmented({ options, value, onChange, ariaLabel }) {
      return h('div', { className: 'dss-tabs', role: 'group', 'aria-label': ariaLabel },
        options.map((option) => h('button', {
          key: option.value,
          type: 'button',
          className: 'dss-tab',
          'aria-pressed': option.value === value,
          onClick: () => {
            if (option.value !== value) onChange(option.value);
          },
        }, option.label)));
    }

    function KpiCard({ icon, tint, label, value, unit, sub }) {
      return h('div', { className: 'dss-card dss-kpi' },
        h('div', { className: 'dss-kpi-top' },
          h('span', { className: 'dss-kpi-icon', style: { color: tint, background: `color-mix(in srgb, ${tint} 12%, transparent)` } }, icon),
          h('span', { className: 'dss-kpi-label' }, label)),
        h('div', { className: 'dss-kpi-value' }, value, unit ? h('span', { className: 'dss-kpi-unit' }, unit) : null),
        h('div', { className: 'dss-kpi-sub' }, sub));
    }

    function BarTooltip({ point, t, left, bucket }) {
      const rows = [
        ['input', t('legend.input'), CHART_COLORS.input],
        ['cacheRead', t('legend.cacheRead'), CHART_COLORS.cacheRead],
        ['cacheWrite', t('legend.cacheWrite'), CHART_COLORS.cacheWrite],
        ['output', t('legend.output'), CHART_COLORS.output],
      ];
      return h('div', { className: 'dss-tip', role: 'presentation', style: { left } },
        h('div', { className: 'dss-tip-title' }, formatPointTitle(point, bucket)),
        h('div', { className: 'dss-tip-total' }, `${formatTokens(point.total)} tokens`),
        rows.map(([key, label, color]) => h('div', { key, className: 'dss-tip-row' },
          h('span', { className: 'dss-swatch', style: { background: color } }),
          h('span', null, label),
          h('span', null, formatTokens(point[key])))));
    }

    function DailyChart({ view, t }) {
      const series = Array.isArray(view.series) ? view.series : [];
      const [hover, setHover] = React.useState(-1);
      const barsRef = React.useRef(null);
      const count = Math.max(series.length, 1);
      const max = Math.max(1, ...series.map((point) => point.total));
      const active = hover >= 0 && hover < series.length ? series[hover] : null;
      const labelEvery = Math.max(1, Math.ceil(count / 7));
      const gap = count > 120 ? 1 : count > 90 ? 2 : count > 45 ? 3 : count > 24 ? 4 : 0;
      const left = active === null
        ? '50%'
        : `clamp(80px, ${(((hover + 0.5) / count) * 100).toFixed(2)}%, calc(100% - 80px))`;
      const handleMove = (event) => {
        const node = barsRef.current;
        if (node === null) return;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = (event.clientX - rect.left) / rect.width;
        const index = Math.min(series.length - 1, Math.max(0, Math.floor(ratio * series.length)));
        setHover(index);
      };
      return h('div', null,
        h('div', {
          className: 'dss-bars',
          ref: barsRef,
          style: gap > 0 ? { gap: `${gap}px` } : undefined,
          onMouseMove: handleMove,
          onMouseLeave: () => setHover(-1),
        },
          series.map((point, index) => {
            const heightPercent = (point.total / max) * 100;
            const segments = [
              ['input', CHART_COLORS.input],
              ['cacheRead', CHART_COLORS.cacheRead],
              ['cacheWrite', CHART_COLORS.cacheWrite],
              ['output', CHART_COLORS.output],
            ];
            const showLabel = index % labelEvery === 0 || index === series.length - 1;
            const labelClass = index === 0
              ? 'dss-bar-label dss-bar-label-first'
              : index === series.length - 1
                ? 'dss-bar-label dss-bar-label-last'
                : 'dss-bar-label';
            return h('div', {
              key: point.ts ?? index,
              className: 'dss-bar-col',
            },
              h('div', { className: 'dss-bar-track' },
                h('div', { className: 'dss-bar-stack', style: { height: `${Math.max(heightPercent, point.total > 0 ? 2 : 0)}%` } },
                  segments.map(([key, color]) => {
                    const share = point.total > 0 ? (point[key] / point.total) * 100 : 0;
                    if (share <= 0) return null;
                    return h('div', { key, className: 'dss-bar-seg', style: { height: `${share}%`, background: color } });
                  }))),
              h('div', { className: labelClass }, showLabel ? point.label : ''));
          }),
          active !== null ? h(BarTooltip, { point: active, t, left, bucket: view.bucket }) : null),
        h('div', { className: 'dss-legend' },
          [
            ['input', t('legend.input'), CHART_COLORS.input],
            ['cacheRead', t('legend.cacheRead'), CHART_COLORS.cacheRead],
            ['cacheWrite', t('legend.cacheWrite'), CHART_COLORS.cacheWrite],
            ['output', t('legend.output'), CHART_COLORS.output],
          ].map(([key, label, color]) => h('span', { key, className: 'dss-legend-item' },
            h('span', { className: 'dss-swatch', style: { background: color } }), label))));
    }

    function Donut({ view, t, money, symbol }) {
      const totals = view.totals;
      const total = totals.total;
      const size = 168;
      const stroke = 18;
      const radius = (size - stroke) / 2;
      const center = size / 2;
      const circumference = 2 * Math.PI * radius;
      const parts = [
        ['input', t('legend.input'), CHART_COLORS.input],
        ['cacheRead', t('legend.cacheRead'), CHART_COLORS.cacheRead],
        ['cacheWrite', t('legend.cacheWrite'), CHART_COLORS.cacheWrite],
        ['output', t('legend.output'), CHART_COLORS.output],
      ];
      let offset = 0;
      const arcs = [];
      for (const [key, , color] of parts) {
        const share = total > 0 ? totals[key] / total : 0;
        const length = share * circumference;
        if (length > 0.01) {
          arcs.push({ key, color, length, offset });
          offset += length;
        }
      }
      return h('div', { className: 'dss-donut-wrap' },
        h('div', { className: 'dss-donut' },
          h('svg', { viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' },
            h('circle', { cx: center, cy: center, r: radius, fill: 'none', stroke: 'color-mix(in srgb, currentColor 8%, transparent)', strokeWidth: stroke }),
            arcs.map((arc) => h('circle', {
              key: arc.key,
              cx: center,
              cy: center,
              r: radius,
              fill: 'none',
              stroke: arc.color,
              strokeWidth: stroke,
              strokeDasharray: `${arc.length} ${Math.max(circumference - arc.length, 0)}`,
              strokeDashoffset: -arc.offset,
              transform: `rotate(-90 ${center} ${center})`,
              strokeLinecap: 'butt',
            }))),
          h('div', { className: 'dss-donut-center' },
            h('div', { className: 'dss-donut-total' }, formatTokens(total)),
            h('div', { className: 'dss-donut-unit' }, 'tokens'),
            h('div', { className: 'dss-donut-cost' }, `${symbol}${money(totals.cost)}`))),
        h('div', { className: 'dss-donut-legend' },
          parts.map(([key, label, color]) => h('div', { key, className: 'dss-donut-row' },
            h('span', { className: 'dss-swatch', style: { background: color } }),
            h('span', { className: 'dss-donut-name' }, label),
            h('span', { className: 'dss-donut-value' }, formatTokens(totals[key])),
            h('span', { className: 'dss-donut-pct' }, `${percentOf(totals[key], total).toFixed(1)}%`)))));
    }

    function RuntimeCard({ runtime, t }) {
      const cores = runtime.cores || 1;
      return h('div', { className: 'dss-card' },
        h('div', { className: 'dss-card-head' },
          h('div', { className: 'dss-card-head-main' },
            h('h2', { className: 'dss-card-title' }, t('runtime.title'),
              h('span', { className: 'dss-live' }, h('span', { className: 'dss-dot' }), t('runtime.live')))),
          h('div', { className: 'dss-card-side' }, t('runtime.cores', { cores, load: runtime.load1 ? runtime.load1.toFixed(2) : '0.00' }))),
        h('div', { className: 'dss-metrics' },
          h('div', null,
            h('div', { className: 'dss-metric-label' }, t('runtime.cpu')),
            h('div', { className: 'dss-metric-value' }, `${runtime.cpuCore.toFixed(1)}%`, h('small', null, t('runtime.cpu.unit'))),
            h('div', { className: 'dss-metric-sub' }, t('runtime.cpu.sub', { machine: runtime.cpuMachine.toFixed(1), cores }))),
          h('div', null,
            h('div', { className: 'dss-metric-label' }, t('runtime.mem')),
            h('div', { className: 'dss-metric-value' }, formatBytes(runtime.rss)),
            h('div', { className: 'dss-metric-sub' }, t('runtime.mem.sub', { value: formatBytes(runtime.heapUsed) }))),
          h('div', null,
            h('div', { className: 'dss-metric-label' }, t('runtime.loop')),
            h('div', { className: 'dss-metric-value' }, `${runtime.loopP99.toFixed(1)} ms`),
            h('div', { className: 'dss-metric-sub' }, t('runtime.loop.sub', { value: `${runtime.loopMean.toFixed(1)} ms` }))),
          h('div', null,
            h('div', { className: 'dss-metric-label' }, t('runtime.uptime')),
            h('div', { className: 'dss-metric-value' }, formatUptime(runtime.uptimeMs)),
            h('div', { className: 'dss-metric-sub' }, t('runtime.uptime.sub', { pid: runtime.pid, node: runtime.node })))));
    }

    function RankingCard({ view, t, sort, setSort, openSession, money, symbol }) {
      const sessions = Array.isArray(view.sessions) ? view.sessions.slice() : [];
      sessions.sort(sort === 'time'
        ? (left, right) => right.activeMs - left.activeMs || right.tokens.total - left.tokens.total
        : sort === 'cost'
          ? (left, right) => right.cost - left.cost || right.tokens.total - left.tokens.total
          : (left, right) => right.tokens.total - left.tokens.total || right.activeMs - left.activeMs);
      const rows = sessions.slice(0, 6);
      const shownFor = (session) => {
        if (sort === 'time') {
          return { primary: formatUptime(session.activeMs), secondary: `${formatTokens(session.tokens.total)} tokens` };
        }
        if (sort === 'cost') {
          return { primary: `${symbol}${money(session.cost)}`, secondary: `${formatTokens(session.tokens.total)} tokens` };
        }
        return { primary: `${formatTokens(session.tokens.total)} tokens`, secondary: `${symbol}${money(session.cost)}` };
      };
      return h('div', { className: 'dss-card' },
        h('div', { className: 'dss-card-head' },
          h('h2', { className: 'dss-card-title' }, t('ranking.title')),
          h(Segmented, {
            ariaLabel: t('ranking.title'),
            value: sort,
            onChange: setSort,
            options: [
              { value: 'tokens', label: t('ranking.byTokens') },
              { value: 'time', label: t('ranking.byTime') },
              { value: 'cost', label: t('ranking.byCost') },
            ],
          })),
        rows.length === 0
          ? h('div', { className: 'dss-empty' }, t('ranking.empty'))
          : h('div', { className: 'dss-rank-list' },
            rows.map((session, index) => {
              const shown = shownFor(session);
              return h('button', {
                key: session.id,
                type: 'button',
                className: 'dss-rank',
                title: session.title || session.id,
                onClick: () => openSession(session.id),
              },
                h('span', { className: 'dss-rank-index' }, String(index + 1)),
                h('span', { className: 'dss-rank-main' },
                  h('span', { className: 'dss-rank-title' }, session.title || session.id),
                  h('span', { className: 'dss-rank-meta' },
                    [session.workspace, t('ranking.turns', { turns: session.turns })].filter(Boolean).join(' · '))),
                h('span', { className: 'dss-rank-nums' },
                  h('span', { className: 'dss-rank-tokens' }, shown.primary),
                  h('span', { className: 'dss-rank-cost' }, shown.secondary)),
                h('span', { className: 'dss-rank-chevron' }, h(IconChevron, { size: 13 })));
            })));
    }

    function PerformanceCard({ view, t }) {
      const perf = view.perf;
      return h('div', { className: 'dss-card' },
        h('h2', { className: 'dss-card-title' }, t('perf.title')),
        h('div', { className: 'dss-perf-grid', style: { marginTop: 14 } },
          h('div', null,
            h('div', { className: 'dss-perf-label' }, t('perf.avgTurn')),
            h('div', { className: 'dss-perf-value' }, formatLatency(perf.avgTurnMs)),
            h('div', { className: 'dss-perf-sub' }, t('perf.avgTurn.sub', { turns: perf.turns }))),
          h('div', null,
            h('div', { className: 'dss-perf-label' }, t('perf.ttft')),
            h('div', { className: 'dss-perf-value' }, formatLatency(perf.ttftMs)),
            h('div', { className: 'dss-perf-sub' }, t('perf.ttft.sub'))),
          h('div', null,
            h('div', { className: 'dss-perf-label' }, t('perf.speed')),
            h('div', { className: 'dss-perf-value' }, formatSpeed(perf.outputSpeed)),
            h('div', { className: 'dss-perf-sub' }, t('perf.speed.sub'))),
          h('div', null,
            h('div', { className: 'dss-perf-label' }, t('perf.errors')),
            h('div', { className: 'dss-perf-value' }, `${perf.toolErrorRate.toFixed(1)}%`),
            h('div', { className: 'dss-perf-sub' }, t('perf.errors.sub', { calls: perf.toolCalls, errors: perf.toolErrors })))),
        h('div', { className: 'dss-perf-note' }, t('perf.note')));
    }

    function ModelsCard({ view, t, money, symbol }) {
      const models = Array.isArray(view.models) ? view.models : [];
      const max = Math.max(1, ...models.map((model) => model.cost));
      const rows = models.map((model) => h('div', { key: model.model, className: 'dss-model' },
        h('div', { className: 'dss-model-head' },
          h('span', { className: 'dss-model-name' }, model.model),
          h('span', { className: 'dss-model-cost' }, `${symbol}${money(model.cost)}`)),
        h('div', { className: 'dss-model-bar' },
          h('div', { className: 'dss-model-fill', style: { width: `${Math.max((model.cost / max) * 100, model.cost > 0 ? 2 : 0)}%` } })),
        h('div', { className: 'dss-model-sub' }, t('models.sub', { sessions: model.sessionCount, tokens: formatTokens(model.tokens) }))));
      return h('div', { className: 'dss-card' },
        h('h2', { className: 'dss-card-title' }, t('models.title')),
        models.length === 0
          ? h('div', { className: 'dss-empty' }, t('models.empty'))
          : h('div', { style: { marginTop: 8 } }, rows));
    }

    function PanelBody({ payload, range, currency, setRange, setCurrency, error, loading, retry, refreshing, openSession, t }) {
      const view = payload ? payload.view : null;
      const runtime = payload && payload.runtime ? payload.runtime : null;
      const rate = payload && Number.isFinite(payload.rate) && payload.rate > 0 ? payload.rate : 7.2;
      const money = (cny) => {
        const value = typeof cny === 'number' && Number.isFinite(cny) ? cny : 0;
        return (currency === 'usd' ? value / rate : value).toFixed(2);
      };
      const symbol = currency === 'usd' ? '$' : '¥';
      const [sort, setSort] = React.useState('tokens');

      const rangeOptions = [
        { value: '24h', label: t('range.24h') },
        { value: '7d', label: t('range.7d') },
        { value: '14d', label: t('range.14d') },
        { value: '30d', label: t('range.30d') },
        { value: 'all', label: t('range.all') },
      ];
      const currencyOptions = [
        { value: 'cny', label: t('currency.cny') },
        { value: 'usd', label: t('currency.usd') },
      ];

      let content = null;
      if (loading && view === null) {
        content = h('div', { className: 'dss-card dss-state' },
          h('div', { className: 'dss-state-title' }, t('state.loading')));
      } else if (view === null) {
        content = h('div', { className: 'dss-card dss-state' },
          h('div', { className: 'dss-state-title' }, t('state.error')),
          h('div', { className: 'dss-state-text' }, error || ''),
          h('button', { type: 'button', className: 'dss-retry', onClick: retry }, t('state.retry')));
      } else {
        const totals = view.totals;
        const sessionCount = view.sessionCount;
        const average = sessionCount > 0 ? totals.total / sessionCount : 0;
        const perMillion = totals.total > 0 ? (totals.cost / totals.total) * 1000000 : 0;
        const averageDisplay = averagePriceUnit(currency === 'usd' ? perMillion / rate : perMillion);
        const firstPoint = view.series.length > 0 ? view.series[0] : null;
        const lastPoint = view.series.length > 0 ? view.series[view.series.length - 1] : null;
        const fromDay = formatDay(firstPoint ? firstPoint.ts : 0);
        const toDay = formatDay(lastPoint ? lastPoint.ts : 0);
        content = h(React.Fragment, null,
          h('div', { className: 'dss-grid' },
            h(KpiCard, {
              icon: h(IconStack, { size: 13 }),
              tint: CHART_COLORS.input,
              label: t('kpi.tokens'),
              value: formatTokens(totals.total),
              unit: 'tokens',
              sub: t('kpi.tokens.sub', { input: formatTokens(totals.input), output: formatTokens(totals.output) }),
            }),
            h(KpiCard, {
              icon: h(IconCost, { size: 13 }),
              tint: CHART_COLORS.cacheRead,
              label: t('kpi.cost'),
              value: `${symbol}${money(totals.cost)}`,
              sub: t('kpi.cost.avg', { value: `${symbol}${averageDisplay.value}`, unit: averageDisplay.unit }),
            }),
            h(KpiCard, {
              icon: h(IconChat, { size: 13 }),
              tint: CHART_COLORS.output,
              label: t('kpi.sessions'),
              value: String(sessionCount),
              sub: t('kpi.sessions.sub', { value: formatTokens(average) }),
            }),
            h(KpiCard, {
              icon: h(IconBolt, { size: 13 }),
              tint: CHART_COLORS.cacheWrite,
              label: t('kpi.cache'),
              value: `${view.cacheHitRate.toFixed(1)}%`,
              sub: t('kpi.cache.sub', { value: formatTokens(totals.cacheRead) }),
            })),
          runtime !== null ? h(RuntimeCard, { runtime, t }) : null,
          h('div', { className: 'dss-row' },
            h('div', { className: 'dss-card' },
              h('div', { className: 'dss-card-head' },
                h('div', { className: 'dss-card-head-main' },
                  h('h2', { className: 'dss-card-title' }, t('daily.title')),
                  h('p', { className: 'dss-card-note' }, view.bucket === 'hour'
                    ? t('daily.hourly')
                    : view.range === 'all'
                      ? t('daily.all', { from: fromDay, to: toDay, days: view.series.length })
                      : t('daily.sub', { range: t(`range.${view.range}`), from: fromDay, to: toDay }))),
                h('div', { className: 'dss-card-side' },
                  h('strong', null, `${formatTokens(totals.total)} tokens`),
                  `${symbol}${money(totals.cost)}`)),
              h(DailyChart, { view, t })),
            h('div', { className: 'dss-card' },
              h('h2', { className: 'dss-card-title' }, t('donut.title')),
              h(Donut, { view, t, money, symbol }))),
          h('div', { className: 'dss-row' },
            h(RankingCard, { view, t, sort, setSort, openSession, money, symbol }),
            h('div', { className: 'dss-stack' },
              h(PerformanceCard, { view, t }),
              h(ModelsCard, { view, t, money, symbol }))),
          h('div', { className: 'dss-footer' }, t('footer.note')));
      }

      return h('div', { className: 'dss-page' },
        h('header', { className: 'dss-head', 'data-window-drag': true },
          h('div', { className: 'dss-head-main' },
            h('h1', { className: 'dss-title' }, t('page.title')),
            h('p', { className: 'dss-sub' }, error !== null && view !== null
              ? `${t('state.error')}：${error}`
              : refreshing
                ? `${t('page.hint')} · ${t('state.refreshing')}`
                : t('page.hint'))),
          h('div', { className: 'dss-controls' },
            h(Segmented, { ariaLabel: t('page.title'), options: rangeOptions, value: range, onChange: setRange }),
            h('span', { className: 'dss-sep', 'aria-hidden': 'true' }),
            h(Segmented, { ariaLabel: t('kpi.cost'), options: currencyOptions, value: currency, onChange: setCurrency }))),
        h('div', { className: 'dss-body' }, content));
    }

    function defaultCurrencyFor(localeId) {
      return typeof localeId === 'string' && localeId.toLowerCase().startsWith('zh') ? 'cny' : 'usd';
    }

    function SessionStatsPage(props) {
      const { t, openSession, localeService } = props;
      const readActiveLocale = () => {
        if (localeService === null || typeof localeService !== 'object' || typeof localeService.getSnapshot !== 'function') return 'zh';
        try {
          const snapshot = localeService.getSnapshot();
          return snapshot !== null && typeof snapshot === 'object' && typeof snapshot.active === 'string' ? snapshot.active : 'zh';
        } catch {
          return 'zh';
        }
      };
      const activeLocale = readActiveLocale();
      const [range, setRange] = React.useState('7d');
      const [currency, setCurrency] = React.useState(() => defaultCurrencyFor(activeLocale));
      const [currencyTouched, setCurrencyTouched] = React.useState(false);
      const [payload, setPayload] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [refreshing, setRefreshing] = React.useState(false);
      const [nonce, setNonce] = React.useState(0);
      const [, setLocaleTick] = React.useState(0);
      const sequence = React.useRef(0);

      React.useEffect(() => {
        if (localeService === null || typeof localeService !== 'object' || typeof localeService.subscribe !== 'function') return undefined;
        return localeService.subscribe(() => setLocaleTick((value) => value + 1));
      }, [localeService]);

      React.useEffect(() => {
        if (!currencyTouched) setCurrency(defaultCurrencyFor(activeLocale));
      }, [activeLocale, currencyTouched]);

      React.useEffect(() => {
        let disposed = false;
        const controller = new AbortController();
        let followUp = 0;
        let followUps = 0;
        const clearFollowUp = () => {
          if (followUp !== 0) {
            window.clearTimeout(followUp);
            followUp = 0;
          }
        };
        const load = async (force) => {
          clearFollowUp();
          const current = sequence.current + 1;
          sequence.current = current;
          try {
            const response = await fetch(ROUTE, {
              method: 'POST',
              headers: { 'content-type': 'application/json', 'x-dsh-session-stats': REQUEST_MARKER },
              body: JSON.stringify({ range, refresh: force === true }),
              signal: controller.signal,
            });
            const value = await response.json().catch(() => null);
            if (disposed || current !== sequence.current) return;
            if (!response.ok || value === null || value.ok !== true) {
              throw new Error(value?.error?.message || `HTTP ${response.status}`);
            }
            const stale = value.stale === true;
            setPayload(value);
            setError(null);
            setLoading(false);
            setRefreshing(stale);
            if (stale && followUps < 12) {
              followUps += 1;
              followUp = window.setTimeout(() => {
                followUp = 0;
                if (!disposed) load(false);
              }, 1600);
            } else if (!stale) {
              followUps = 0;
            }
          } catch (failure) {
            if (disposed || controller.signal.aborted || current !== sequence.current) return;
            setError(String(failure?.message ?? failure));
            setLoading(false);
            setRefreshing(false);
          }
        };
        setLoading(true);
        load(false);
        const timer = window.setInterval(() => {
          if (!document.hidden) load(false);
        }, 20000);
        return () => {
          disposed = true;
          controller.abort();
          window.clearInterval(timer);
          clearFollowUp();
        };
      }, [range, nonce]);

      return h(PanelBody, {
        payload,
        range,
        currency,
        setRange,
        setCurrency: (next) => {
          setCurrencyTouched(true);
          setCurrency(next);
        },
        error,
        loading,
        retry: () => setNonce((value) => value + 1),
        refreshing,
        openSession,
        t,
      });
    }

    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      render() {
        if (this.state.error !== null) {
          return h('div', { className: 'dss-page' },
            h('div', { className: 'dss-card dss-state', style: { marginTop: 40 } },
              h('div', { className: 'dss-state-title' }, this.props.t('state.error')),
              h('div', { className: 'dss-state-text' }, String(this.state.error?.message ?? this.state.error))));
        }
        return this.props.children;
      }
    }

    function SafePage(props) {
      return h(PanelBoundary, { t: props.t }, h(SessionStatsPage, props));
    }

    function PanelIcon({ size, active }) {
      const dimension = typeof size === 'number' ? size : 16;
      return h('svg', {
        viewBox: '0 0 16 16',
        width: dimension,
        height: dimension,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        style: { opacity: active ? 1 : 0.86 },
      },
        h('path', { d: 'M2.3 13.6h11.4' }),
        h('path', { d: 'M4.4 13.1V8.2' }),
        h('path', { d: 'M8 13.1V4.1' }),
        h('path', { d: 'M11.6 13.1V6.5' }));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'session-stats: dictionaries');
        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.plugin = '@bright9025/dsh-session-stats-viewer';
          tag.textContent = CSS;
          document.head.appendChild(tag);
          return () => tag.remove();
        }, 'session-stats: styles');

        const openSession = (sessionId) => {
          const workspace = ctx.get('uiWorkspace');
          if (workspace && typeof workspace.openSession === 'function') {
            try {
              workspace.openSession(sessionId);
            } catch {
              /* Navigation is best effort. */
            }
          }
        };

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'session-stats',
          order: 20,
          label: () => ctx.locale.bind(NS)('nav.title'),
          locale: NS,
        }, PanelIcon));

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'session-stats',
          locale: NS,
          inject: () => ({ openSession, localeService: ctx.locale }),
        }, SafePage));
      },
    };
  },
});
