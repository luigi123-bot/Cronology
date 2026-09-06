/**
 * services/syncedSeriesEpisodes.ts
 * Auto-generado por scripts/sync-drive.js
 * Catálogo estructurado por Series y por Temporadas desde Google Drive.
 * NO EDITAR MANUALMENTE - se sobreescribe al sincronizar.
 * 
 * Última actualización: 2026-09-06T20:50:24.727Z
 * Series sincronizadas: 2
 */

export interface SyncedEpisode {
  fileId: string;
  title: string;
  quality: string;
  season?: number;
  episode?: number;
}

export interface SyncedSeriesEntry {
  seriesKey: string;
  seriesName: string;
  folderUrl: string;
  folderId: string;
  seasonsCount?: number;
  episodesCount?: number;
  seasons?: Record<number, Record<string, SyncedEpisode>>;
  episodes: Record<string, SyncedEpisode>;
}

export const SYNCED_SERIES_DATA: Record<string, SyncedSeriesEntry> = {
  "gravity-falls": {
    "seriesKey": "gravity-falls",
    "seriesName": "Gravity Falls",
    "folderUrl": "https://drive.google.com/drive/folders/1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS",
    "folderId": "1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS",
    "seasonsCount": 1,
    "episodesCount": 15,
    "seasons": {
      "1": {
        "gravity-falls-s1e1": {
          "fileId": "1OLDAv3eG2DUy97K7kkjxPQZeW3bGcY13",
          "title": "Gravity.Falls.S01E01.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 1
        },
        "gravity-falls-s1e2": {
          "fileId": "1dfx_nt81WhuNDijj762Ia5wZLG0IBgXF",
          "title": "Gravity.Falls.S01E02.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 2
        },
        "gravity-falls-s1e3": {
          "fileId": "1TW_HCc_nIpnjx2MltMZcoPESNa1Jx7O0",
          "title": "Gravity.Falls.S01E03.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 3
        },
        "gravity-falls-s1e4": {
          "fileId": "1uXeirkLHanSnZXY8RHCOwnMF6BPVm5QL",
          "title": "Gravity.Falls.S01E04.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 4
        },
        "gravity-falls-s1e5": {
          "fileId": "1gWmQCFov8URfYW-Ar-7JTutwNc3T3UZn",
          "title": "Gravity.Falls.S01E05.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 5
        },
        "gravity-falls-s1e6": {
          "fileId": "1wEMYgflnbcUIB3IWQCyla-rBxcWBOkIO",
          "title": "Gravity.Falls.S01E06.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 6
        },
        "gravity-falls-s1e7": {
          "fileId": "1QG5AIuNZEkCdMrWTxWEGykZMQ9lUQSwF",
          "title": "Gravity.Falls.S01E07.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 7
        },
        "gravity-falls-s1e8": {
          "fileId": "1XjUOheuOIJqg-Zx3wzxJvzy_etJUAfUA",
          "title": "Gravity.Falls.S01E08.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 8
        },
        "gravity-falls-s1e9": {
          "fileId": "1lUZQaJfcZQoQMQvaersPPbn6ZWYexLqJ",
          "title": "Gravity.Falls.S01E09.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 9
        },
        "gravity-falls-s1e10": {
          "fileId": "1Fx2UZNp0WapfV_aHBQzWMOW_Sl-Dm9QU",
          "title": "Gravity.Falls.S01E10.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 10
        },
        "gravity-falls-s1e11": {
          "fileId": "1_JEQYfAzzQLEm8Kg8hR456AkZ4C7qWnc",
          "title": "Gravity.Falls.S01E11.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 11
        },
        "gravity-falls-s1e12": {
          "fileId": "1Oft3QjKrxEFJkaSTh4J1Sx6p1yWTRtnM",
          "title": "Gravity.Falls.S01E12.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 12
        },
        "gravity-falls-s1e13": {
          "fileId": "1MarcQL2qtdH_m2GGOH1f6lYAgfDBxXy4",
          "title": "Gravity.Falls.S01E13.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 13
        },
        "gravity-falls-s1e14": {
          "fileId": "1NN9BXKDAsiYF7WCPWOeqcxdaxJzVqE0J",
          "title": "Gravity.Falls.S01E14.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 14
        },
        "gravity-falls-s1e15": {
          "fileId": "1Z3op-dsyuRtP0SVNs66gQN_FXdZqvZoz",
          "title": "Gravity.Falls.S01E15.2012.1080p-Dual-Lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 15
        }
      }
    },
    "episodes": {
      "gravity-falls-s1e1": {
        "fileId": "1OLDAv3eG2DUy97K7kkjxPQZeW3bGcY13",
        "title": "Gravity.Falls.S01E01.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 1
      },
      "gravity-falls-s1e2": {
        "fileId": "1dfx_nt81WhuNDijj762Ia5wZLG0IBgXF",
        "title": "Gravity.Falls.S01E02.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 2
      },
      "gravity-falls-s1e3": {
        "fileId": "1TW_HCc_nIpnjx2MltMZcoPESNa1Jx7O0",
        "title": "Gravity.Falls.S01E03.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 3
      },
      "gravity-falls-s1e4": {
        "fileId": "1uXeirkLHanSnZXY8RHCOwnMF6BPVm5QL",
        "title": "Gravity.Falls.S01E04.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 4
      },
      "gravity-falls-s1e5": {
        "fileId": "1gWmQCFov8URfYW-Ar-7JTutwNc3T3UZn",
        "title": "Gravity.Falls.S01E05.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 5
      },
      "gravity-falls-s1e6": {
        "fileId": "1wEMYgflnbcUIB3IWQCyla-rBxcWBOkIO",
        "title": "Gravity.Falls.S01E06.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 6
      },
      "gravity-falls-s1e7": {
        "fileId": "1QG5AIuNZEkCdMrWTxWEGykZMQ9lUQSwF",
        "title": "Gravity.Falls.S01E07.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 7
      },
      "gravity-falls-s1e8": {
        "fileId": "1XjUOheuOIJqg-Zx3wzxJvzy_etJUAfUA",
        "title": "Gravity.Falls.S01E08.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 8
      },
      "gravity-falls-s1e9": {
        "fileId": "1lUZQaJfcZQoQMQvaersPPbn6ZWYexLqJ",
        "title": "Gravity.Falls.S01E09.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 9
      },
      "gravity-falls-s1e10": {
        "fileId": "1Fx2UZNp0WapfV_aHBQzWMOW_Sl-Dm9QU",
        "title": "Gravity.Falls.S01E10.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 10
      },
      "gravity-falls-s1e11": {
        "fileId": "1_JEQYfAzzQLEm8Kg8hR456AkZ4C7qWnc",
        "title": "Gravity.Falls.S01E11.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 11
      },
      "gravity-falls-s1e12": {
        "fileId": "1Oft3QjKrxEFJkaSTh4J1Sx6p1yWTRtnM",
        "title": "Gravity.Falls.S01E12.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 12
      },
      "gravity-falls-s1e13": {
        "fileId": "1MarcQL2qtdH_m2GGOH1f6lYAgfDBxXy4",
        "title": "Gravity.Falls.S01E13.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 13
      },
      "gravity-falls-s1e14": {
        "fileId": "1NN9BXKDAsiYF7WCPWOeqcxdaxJzVqE0J",
        "title": "Gravity.Falls.S01E14.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 14
      },
      "gravity-falls-s1e15": {
        "fileId": "1Z3op-dsyuRtP0SVNs66gQN_FXdZqvZoz",
        "title": "Gravity.Falls.S01E15.2012.1080p-Dual-Lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 15
      }
    }
  },
  "grimm": {
    "seriesKey": "grimm",
    "seriesName": "Grimm",
    "folderUrl": "https://drive.google.com/drive/folders/1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS",
    "folderId": "1lVqDRczGqe-3cYuTcD_NC2Nu0n955TjS",
    "seasonsCount": 2,
    "episodesCount": 43,
    "seasons": {
      "1": {
        "grimm-s1e1": {
          "fileId": "12anfnPB2mtTG5G0fi_4nV9hMvtrfk7Jy",
          "title": "Grimm.1x01.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 1
        },
        "grimm-s1e2": {
          "fileId": "1g17xPECwlTphlS8kcR5qpkA3EeMovBQd",
          "title": "Grimm.1x02.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 2
        },
        "grimm-s1e3": {
          "fileId": "1cbPeKMJx7W5Pv5WzpkryEuLdPq9llycv",
          "title": "Grimm.1x03.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 3
        },
        "grimm-s1e4": {
          "fileId": "1mV6Ir5IEfEjDyAR4mr4o2GdgrYiP-8qq",
          "title": "Grimm.1x04.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 4
        },
        "grimm-s1e5": {
          "fileId": "1hF9Vya-t8KuJD8iuqYeM_k_kKlZRkCAF",
          "title": "Grimm.1x05.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 5
        },
        "grimm-s1e6": {
          "fileId": "1GFrta7R5cRQLfW0RcLwk7jUoZAAMVZgY",
          "title": "Grimm.1x06.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 6
        },
        "grimm-s1e7": {
          "fileId": "1bc4dBKx5vUOCgSILFDBo554q-mz01Hjp",
          "title": "Grimm.1x07.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 7
        },
        "grimm-s1e8": {
          "fileId": "1-95Yez-3chUZK_t_BkkiDYgFMYaGMqVL",
          "title": "Grimm.1x08.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 8
        },
        "grimm-s1e10": {
          "fileId": "1uBTnS2cgqxbLQd6mq_l4bTsGZYabD3fK",
          "title": "Grimm.1x10.HD1080p-lat.mkv",
          "quality": "1080p HD Latino",
          "season": 1,
          "episode": 10
        },
        "grimm-s1e11": {
          "fileId": "1guos_LmcB-Tg1pbf2T959Klw_a6lSUfZ",
          "title": "Grimm.1x11.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 11
        },
        "grimm-s1e12": {
          "fileId": "18Ak9YC7zoUdXvLJ99lu_jbZnMvmYRomg",
          "title": "Grimm.1x12.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 12
        },
        "grimm-s1e13": {
          "fileId": "1SY2b6WeGpu84NWk3IRGzxL0ZK5FdBXn2",
          "title": "Grimm.1x13.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 13
        },
        "grimm-s1e14": {
          "fileId": "1HUWtoiKZp537AlKNyTENBxFFFPbWgz0X",
          "title": "Grimm.1x14.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 14
        },
        "grimm-s1e15": {
          "fileId": "1JR5tckk_pASBjiUm29hWxuEm9JI0T9o-",
          "title": "Grimm.1x15.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 15
        },
        "grimm-s1e16": {
          "fileId": "15koE9OTJdUyUwkEhmNUKp3TymabT0oq7",
          "title": "Grimm.1x16.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 16
        },
        "grimm-s1e17": {
          "fileId": "1ZFd7DRbz3Hqy7m7lpE_Fq3fd3CxayS7V",
          "title": "Grimm.1x17.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 17
        },
        "grimm-s1e18": {
          "fileId": "1inGcre4hPFW2p7dC0vjrJ2RgrnV_ncjR",
          "title": "Grimm.1x18.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 18
        },
        "grimm-s1e19": {
          "fileId": "1k3Woq_HjhDfRfJpaF5ii3L2Aky91hNm_",
          "title": "Grimm.1x19.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 19
        },
        "grimm-s1e20": {
          "fileId": "1nD0n-bUkMdPhuvsXJDKFndg4paH9aT_T",
          "title": "Grimm.1x20.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 20
        },
        "grimm-s1e21": {
          "fileId": "1ygCst2mImjxFfQVGyAZpGuSsIH9UzjuJ",
          "title": "Grimm.1x21.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 21
        },
        "grimm-s1e22": {
          "fileId": "1de2spze4gB0Wvh2cIRMIL-SJ-FwMksGS",
          "title": "Grimm.1x22.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 1,
          "episode": 22
        }
      },
      "2": {
        "grimm-s2e1": {
          "fileId": "14Wj65ISotMPqbfewAU21OUCY1kDJLNj9",
          "title": "Grimm.2x01.Dual.1080p-lat.mp4",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 1
        },
        "grimm-s2e2": {
          "fileId": "1WEHFqKHWTk3SzBTKgz1kZw_kK9LOZMKJ",
          "title": "Grimm.2x02.Dual.1080p-lat.mp4",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 2
        },
        "grimm-s2e3": {
          "fileId": "18lQqsLYTqxM0OIGTS8dyT6oKrszDbkCp",
          "title": "Grimm.2x03.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 3
        },
        "grimm-s2e4": {
          "fileId": "15wA08oI24TY8t8lDMWoxXThu8L_oJx0u",
          "title": "Grimm.2x04.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 4
        },
        "grimm-s2e5": {
          "fileId": "1NlQ-i5Z9Cm-yjuTSZ0uVLQyVnjfyv2-1",
          "title": "Grimm.2x05.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 5
        },
        "grimm-s2e6": {
          "fileId": "1Dx0J2icLvyV6ONn8UFuXZV1d6YDy1I5F",
          "title": "Grimm.2x06.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 6
        },
        "grimm-s2e7": {
          "fileId": "12BPfIzxaBF4c1hT5wq23hBTJE0ki9Mz8",
          "title": "Grimm.2x07.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 7
        },
        "grimm-s2e8": {
          "fileId": "1S68fLFoGbdVj8J2cc8wf3-8UqRVocwJe",
          "title": "Grimm.2x08.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 8
        },
        "grimm-s2e9": {
          "fileId": "1sVeyXL_dsZDU1wMPlItj9MgeMyySl1ZF",
          "title": "Grimm.2x09.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 9
        },
        "grimm-s2e10": {
          "fileId": "1vStalSSo7uxZMhISdP2xMWtXq9qE1TY7",
          "title": "Grimm.2x10.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 10
        },
        "grimm-s2e11": {
          "fileId": "1y90b9xfMhTXdRUTMxV5W_XKqb17FBlq3",
          "title": "Grimm.2x11.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 11
        },
        "grimm-s2e12": {
          "fileId": "1UEB8YSNDHvGdzwIgk-ApAU-s3qR6ZuUN",
          "title": "Grimm.2x12.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 12
        },
        "grimm-s2e13": {
          "fileId": "1AmY9_eI3x_SiBiE-c_t81Us0uxbhiZgB",
          "title": "Grimm.2x13.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 13
        },
        "grimm-s2e14": {
          "fileId": "1EPVHTiP4UzGgYEFBHUGibvLxpiFtZO1W",
          "title": "Grimm.2x14.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 14
        },
        "grimm-s2e15": {
          "fileId": "1sz5LqUVgFdxDSzYpVl3bJ7DwMDNEAhpl",
          "title": "Grimm.2x15.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 15
        },
        "grimm-s2e16": {
          "fileId": "1eQgyXDb_JFv2zOQe7kjrA3KuLBWu2oSQ",
          "title": "Grimm.2x16.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 16
        },
        "grimm-s2e17": {
          "fileId": "1ZoxMpoaPz7og4PG_6Bc1utBrigk9g0Bs",
          "title": "Grimm.2x17.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 17
        },
        "grimm-s2e18": {
          "fileId": "1CO_taksgEHNGgkA0iUDAbuvNYcvTrse1",
          "title": "Grimm.2x18.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 18
        },
        "grimm-s2e19": {
          "fileId": "1EMls6FkD7QMrVrSIikeQRi-hfhoYXTkX",
          "title": "Grimm.2x19.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 19
        },
        "grimm-s2e20": {
          "fileId": "118fvEBoEFtktlYIYsmPhArZS1w_G34W5",
          "title": "Grimm.2x20.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 20
        },
        "grimm-s2e21": {
          "fileId": "1243kzbDM9KIaW_owr_SSXEzM1eXOT-6U",
          "title": "Grimm.2x21.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 21
        },
        "grimm-s2e22": {
          "fileId": "1vAwKUDiiOV782AYhZ6VQ0w4dKVuz08De",
          "title": "Grimm.2x22.Dual.1080p-lat.mkv",
          "quality": "1080p Dual Latino / Inglés",
          "season": 2,
          "episode": 22
        }
      }
    },
    "episodes": {
      "grimm-s1e1": {
        "fileId": "12anfnPB2mtTG5G0fi_4nV9hMvtrfk7Jy",
        "title": "Grimm.1x01.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 1
      },
      "grimm-s1e2": {
        "fileId": "1g17xPECwlTphlS8kcR5qpkA3EeMovBQd",
        "title": "Grimm.1x02.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 2
      },
      "grimm-s1e3": {
        "fileId": "1cbPeKMJx7W5Pv5WzpkryEuLdPq9llycv",
        "title": "Grimm.1x03.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 3
      },
      "grimm-s1e4": {
        "fileId": "1mV6Ir5IEfEjDyAR4mr4o2GdgrYiP-8qq",
        "title": "Grimm.1x04.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 4
      },
      "grimm-s1e5": {
        "fileId": "1hF9Vya-t8KuJD8iuqYeM_k_kKlZRkCAF",
        "title": "Grimm.1x05.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 5
      },
      "grimm-s1e6": {
        "fileId": "1GFrta7R5cRQLfW0RcLwk7jUoZAAMVZgY",
        "title": "Grimm.1x06.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 6
      },
      "grimm-s1e7": {
        "fileId": "1bc4dBKx5vUOCgSILFDBo554q-mz01Hjp",
        "title": "Grimm.1x07.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 7
      },
      "grimm-s1e8": {
        "fileId": "1-95Yez-3chUZK_t_BkkiDYgFMYaGMqVL",
        "title": "Grimm.1x08.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 8
      },
      "grimm-s1e10": {
        "fileId": "1uBTnS2cgqxbLQd6mq_l4bTsGZYabD3fK",
        "title": "Grimm.1x10.HD1080p-lat.mkv",
        "quality": "1080p HD Latino",
        "season": 1,
        "episode": 10
      },
      "grimm-s1e11": {
        "fileId": "1guos_LmcB-Tg1pbf2T959Klw_a6lSUfZ",
        "title": "Grimm.1x11.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 11
      },
      "grimm-s1e12": {
        "fileId": "18Ak9YC7zoUdXvLJ99lu_jbZnMvmYRomg",
        "title": "Grimm.1x12.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 12
      },
      "grimm-s1e13": {
        "fileId": "1SY2b6WeGpu84NWk3IRGzxL0ZK5FdBXn2",
        "title": "Grimm.1x13.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 13
      },
      "grimm-s1e14": {
        "fileId": "1HUWtoiKZp537AlKNyTENBxFFFPbWgz0X",
        "title": "Grimm.1x14.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 14
      },
      "grimm-s1e15": {
        "fileId": "1JR5tckk_pASBjiUm29hWxuEm9JI0T9o-",
        "title": "Grimm.1x15.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 15
      },
      "grimm-s1e16": {
        "fileId": "15koE9OTJdUyUwkEhmNUKp3TymabT0oq7",
        "title": "Grimm.1x16.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 16
      },
      "grimm-s1e17": {
        "fileId": "1ZFd7DRbz3Hqy7m7lpE_Fq3fd3CxayS7V",
        "title": "Grimm.1x17.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 17
      },
      "grimm-s1e18": {
        "fileId": "1inGcre4hPFW2p7dC0vjrJ2RgrnV_ncjR",
        "title": "Grimm.1x18.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 18
      },
      "grimm-s1e19": {
        "fileId": "1k3Woq_HjhDfRfJpaF5ii3L2Aky91hNm_",
        "title": "Grimm.1x19.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 19
      },
      "grimm-s1e20": {
        "fileId": "1nD0n-bUkMdPhuvsXJDKFndg4paH9aT_T",
        "title": "Grimm.1x20.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 20
      },
      "grimm-s1e21": {
        "fileId": "1ygCst2mImjxFfQVGyAZpGuSsIH9UzjuJ",
        "title": "Grimm.1x21.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 21
      },
      "grimm-s1e22": {
        "fileId": "1de2spze4gB0Wvh2cIRMIL-SJ-FwMksGS",
        "title": "Grimm.1x22.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 1,
        "episode": 22
      },
      "grimm-s2e1": {
        "fileId": "14Wj65ISotMPqbfewAU21OUCY1kDJLNj9",
        "title": "Grimm.2x01.Dual.1080p-lat.mp4",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 1
      },
      "grimm-s2e2": {
        "fileId": "1WEHFqKHWTk3SzBTKgz1kZw_kK9LOZMKJ",
        "title": "Grimm.2x02.Dual.1080p-lat.mp4",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 2
      },
      "grimm-s2e3": {
        "fileId": "18lQqsLYTqxM0OIGTS8dyT6oKrszDbkCp",
        "title": "Grimm.2x03.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 3
      },
      "grimm-s2e4": {
        "fileId": "15wA08oI24TY8t8lDMWoxXThu8L_oJx0u",
        "title": "Grimm.2x04.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 4
      },
      "grimm-s2e5": {
        "fileId": "1NlQ-i5Z9Cm-yjuTSZ0uVLQyVnjfyv2-1",
        "title": "Grimm.2x05.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 5
      },
      "grimm-s2e6": {
        "fileId": "1Dx0J2icLvyV6ONn8UFuXZV1d6YDy1I5F",
        "title": "Grimm.2x06.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 6
      },
      "grimm-s2e7": {
        "fileId": "12BPfIzxaBF4c1hT5wq23hBTJE0ki9Mz8",
        "title": "Grimm.2x07.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 7
      },
      "grimm-s2e8": {
        "fileId": "1S68fLFoGbdVj8J2cc8wf3-8UqRVocwJe",
        "title": "Grimm.2x08.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 8
      },
      "grimm-s2e9": {
        "fileId": "1sVeyXL_dsZDU1wMPlItj9MgeMyySl1ZF",
        "title": "Grimm.2x09.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 9
      },
      "grimm-s2e10": {
        "fileId": "1vStalSSo7uxZMhISdP2xMWtXq9qE1TY7",
        "title": "Grimm.2x10.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 10
      },
      "grimm-s2e11": {
        "fileId": "1y90b9xfMhTXdRUTMxV5W_XKqb17FBlq3",
        "title": "Grimm.2x11.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 11
      },
      "grimm-s2e12": {
        "fileId": "1UEB8YSNDHvGdzwIgk-ApAU-s3qR6ZuUN",
        "title": "Grimm.2x12.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 12
      },
      "grimm-s2e13": {
        "fileId": "1AmY9_eI3x_SiBiE-c_t81Us0uxbhiZgB",
        "title": "Grimm.2x13.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 13
      },
      "grimm-s2e14": {
        "fileId": "1EPVHTiP4UzGgYEFBHUGibvLxpiFtZO1W",
        "title": "Grimm.2x14.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 14
      },
      "grimm-s2e15": {
        "fileId": "1sz5LqUVgFdxDSzYpVl3bJ7DwMDNEAhpl",
        "title": "Grimm.2x15.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 15
      },
      "grimm-s2e16": {
        "fileId": "1eQgyXDb_JFv2zOQe7kjrA3KuLBWu2oSQ",
        "title": "Grimm.2x16.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 16
      },
      "grimm-s2e17": {
        "fileId": "1ZoxMpoaPz7og4PG_6Bc1utBrigk9g0Bs",
        "title": "Grimm.2x17.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 17
      },
      "grimm-s2e18": {
        "fileId": "1CO_taksgEHNGgkA0iUDAbuvNYcvTrse1",
        "title": "Grimm.2x18.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 18
      },
      "grimm-s2e19": {
        "fileId": "1EMls6FkD7QMrVrSIikeQRi-hfhoYXTkX",
        "title": "Grimm.2x19.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 19
      },
      "grimm-s2e20": {
        "fileId": "118fvEBoEFtktlYIYsmPhArZS1w_G34W5",
        "title": "Grimm.2x20.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 20
      },
      "grimm-s2e21": {
        "fileId": "1243kzbDM9KIaW_owr_SSXEzM1eXOT-6U",
        "title": "Grimm.2x21.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 21
      },
      "grimm-s2e22": {
        "fileId": "1vAwKUDiiOV782AYhZ6VQ0w4dKVuz08De",
        "title": "Grimm.2x22.Dual.1080p-lat.mkv",
        "quality": "1080p Dual Latino / Inglés",
        "season": 2,
        "episode": 22
      }
    }
  }
};
