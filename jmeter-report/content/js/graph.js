/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
$(document).ready(function() {

    $(".click-title").mouseenter( function(    e){
        e.preventDefault();
        this.style.cursor="pointer";
    });
    $(".click-title").mousedown( function(event){
        event.preventDefault();
    });

    // Ugly code while this script is shared among several pages
    try{
        refreshHitsPerSecond(true);
    } catch(e){}
    try{
        refreshResponseTimeOverTime(true);
    } catch(e){}
    try{
        refreshResponseTimePercentiles();
    } catch(e){}
});


var responseTimePercentilesInfos = {
        data: {"result": {"minY": 167.0, "minX": 0.0, "maxY": 18654.0, "series": [{"data": [[0.0, 167.0], [0.1, 181.0], [0.2, 182.0], [0.3, 182.0], [0.4, 183.0], [0.5, 183.0], [0.6, 186.0], [0.7, 188.0], [0.8, 193.0], [0.9, 196.0], [1.0, 200.0], [1.1, 203.0], [1.2, 203.0], [1.3, 205.0], [1.4, 206.0], [1.5, 206.0], [1.6, 207.0], [1.7, 208.0], [1.8, 208.0], [1.9, 209.0], [2.0, 209.0], [2.1, 209.0], [2.2, 210.0], [2.3, 215.0], [2.4, 217.0], [2.5, 218.0], [2.6, 218.0], [2.7, 219.0], [2.8, 219.0], [2.9, 223.0], [3.0, 224.0], [3.1, 227.0], [3.2, 235.0], [3.3, 236.0], [3.4, 239.0], [3.5, 245.0], [3.6, 247.0], [3.7, 249.0], [3.8, 252.0], [3.9, 260.0], [4.0, 264.0], [4.1, 267.0], [4.2, 268.0], [4.3, 273.0], [4.4, 276.0], [4.5, 282.0], [4.6, 287.0], [4.7, 293.0], [4.8, 304.0], [4.9, 308.0], [5.0, 309.0], [5.1, 311.0], [5.2, 312.0], [5.3, 313.0], [5.4, 318.0], [5.5, 321.0], [5.6, 323.0], [5.7, 323.0], [5.8, 327.0], [5.9, 334.0], [6.0, 335.0], [6.1, 340.0], [6.2, 348.0], [6.3, 353.0], [6.4, 353.0], [6.5, 356.0], [6.6, 358.0], [6.7, 362.0], [6.8, 363.0], [6.9, 365.0], [7.0, 371.0], [7.1, 376.0], [7.2, 383.0], [7.3, 386.0], [7.4, 393.0], [7.5, 398.0], [7.6, 400.0], [7.7, 402.0], [7.8, 407.0], [7.9, 416.0], [8.0, 417.0], [8.1, 424.0], [8.2, 428.0], [8.3, 435.0], [8.4, 442.0], [8.5, 446.0], [8.6, 460.0], [8.7, 465.0], [8.8, 473.0], [8.9, 479.0], [9.0, 484.0], [9.1, 486.0], [9.2, 491.0], [9.3, 492.0], [9.4, 499.0], [9.5, 502.0], [9.6, 506.0], [9.7, 507.0], [9.8, 511.0], [9.9, 512.0], [10.0, 514.0], [10.1, 515.0], [10.2, 518.0], [10.3, 518.0], [10.4, 520.0], [10.5, 520.0], [10.6, 522.0], [10.7, 524.0], [10.8, 525.0], [10.9, 528.0], [11.0, 528.0], [11.1, 529.0], [11.2, 530.0], [11.3, 531.0], [11.4, 532.0], [11.5, 532.0], [11.6, 533.0], [11.7, 535.0], [11.8, 537.0], [11.9, 537.0], [12.0, 538.0], [12.1, 539.0], [12.2, 541.0], [12.3, 543.0], [12.4, 544.0], [12.5, 545.0], [12.6, 545.0], [12.7, 546.0], [12.8, 547.0], [12.9, 548.0], [13.0, 551.0], [13.1, 551.0], [13.2, 554.0], [13.3, 554.0], [13.4, 555.0], [13.5, 557.0], [13.6, 557.0], [13.7, 558.0], [13.8, 559.0], [13.9, 559.0], [14.0, 560.0], [14.1, 560.0], [14.2, 562.0], [14.3, 564.0], [14.4, 566.0], [14.5, 568.0], [14.6, 571.0], [14.7, 572.0], [14.8, 573.0], [14.9, 576.0], [15.0, 578.0], [15.1, 579.0], [15.2, 580.0], [15.3, 583.0], [15.4, 583.0], [15.5, 584.0], [15.6, 584.0], [15.7, 586.0], [15.8, 586.0], [15.9, 587.0], [16.0, 588.0], [16.1, 589.0], [16.2, 589.0], [16.3, 590.0], [16.4, 591.0], [16.5, 591.0], [16.6, 592.0], [16.7, 592.0], [16.8, 594.0], [16.9, 594.0], [17.0, 595.0], [17.1, 595.0], [17.2, 596.0], [17.3, 597.0], [17.4, 598.0], [17.5, 599.0], [17.6, 600.0], [17.7, 601.0], [17.8, 602.0], [17.9, 602.0], [18.0, 603.0], [18.1, 604.0], [18.2, 605.0], [18.3, 605.0], [18.4, 607.0], [18.5, 608.0], [18.6, 608.0], [18.7, 609.0], [18.8, 610.0], [18.9, 610.0], [19.0, 610.0], [19.1, 611.0], [19.2, 612.0], [19.3, 612.0], [19.4, 613.0], [19.5, 615.0], [19.6, 615.0], [19.7, 616.0], [19.8, 617.0], [19.9, 619.0], [20.0, 620.0], [20.1, 620.0], [20.2, 620.0], [20.3, 621.0], [20.4, 623.0], [20.5, 625.0], [20.6, 626.0], [20.7, 627.0], [20.8, 628.0], [20.9, 628.0], [21.0, 629.0], [21.1, 629.0], [21.2, 630.0], [21.3, 631.0], [21.4, 631.0], [21.5, 633.0], [21.6, 634.0], [21.7, 637.0], [21.8, 639.0], [21.9, 641.0], [22.0, 643.0], [22.1, 645.0], [22.2, 648.0], [22.3, 649.0], [22.4, 652.0], [22.5, 654.0], [22.6, 655.0], [22.7, 655.0], [22.8, 657.0], [22.9, 658.0], [23.0, 663.0], [23.1, 666.0], [23.2, 667.0], [23.3, 670.0], [23.4, 671.0], [23.5, 674.0], [23.6, 675.0], [23.7, 676.0], [23.8, 679.0], [23.9, 680.0], [24.0, 682.0], [24.1, 683.0], [24.2, 686.0], [24.3, 689.0], [24.4, 690.0], [24.5, 690.0], [24.6, 694.0], [24.7, 697.0], [24.8, 699.0], [24.9, 700.0], [25.0, 702.0], [25.1, 703.0], [25.2, 707.0], [25.3, 708.0], [25.4, 710.0], [25.5, 711.0], [25.6, 713.0], [25.7, 714.0], [25.8, 715.0], [25.9, 716.0], [26.0, 717.0], [26.1, 719.0], [26.2, 719.0], [26.3, 720.0], [26.4, 721.0], [26.5, 722.0], [26.6, 728.0], [26.7, 730.0], [26.8, 731.0], [26.9, 732.0], [27.0, 734.0], [27.1, 735.0], [27.2, 736.0], [27.3, 738.0], [27.4, 742.0], [27.5, 743.0], [27.6, 745.0], [27.7, 747.0], [27.8, 749.0], [27.9, 752.0], [28.0, 756.0], [28.1, 758.0], [28.2, 759.0], [28.3, 760.0], [28.4, 762.0], [28.5, 765.0], [28.6, 768.0], [28.7, 769.0], [28.8, 769.0], [28.9, 771.0], [29.0, 774.0], [29.1, 774.0], [29.2, 777.0], [29.3, 778.0], [29.4, 782.0], [29.5, 785.0], [29.6, 785.0], [29.7, 786.0], [29.8, 787.0], [29.9, 790.0], [30.0, 791.0], [30.1, 794.0], [30.2, 796.0], [30.3, 798.0], [30.4, 799.0], [30.5, 800.0], [30.6, 800.0], [30.7, 802.0], [30.8, 805.0], [30.9, 805.0], [31.0, 807.0], [31.1, 808.0], [31.2, 809.0], [31.3, 811.0], [31.4, 813.0], [31.5, 815.0], [31.6, 818.0], [31.7, 818.0], [31.8, 820.0], [31.9, 820.0], [32.0, 820.0], [32.1, 822.0], [32.2, 823.0], [32.3, 825.0], [32.4, 826.0], [32.5, 828.0], [32.6, 829.0], [32.7, 830.0], [32.8, 832.0], [32.9, 834.0], [33.0, 836.0], [33.1, 838.0], [33.2, 839.0], [33.3, 842.0], [33.4, 846.0], [33.5, 849.0], [33.6, 851.0], [33.7, 852.0], [33.8, 855.0], [33.9, 856.0], [34.0, 857.0], [34.1, 857.0], [34.2, 859.0], [34.3, 860.0], [34.4, 862.0], [34.5, 867.0], [34.6, 868.0], [34.7, 870.0], [34.8, 873.0], [34.9, 874.0], [35.0, 874.0], [35.1, 875.0], [35.2, 876.0], [35.3, 878.0], [35.4, 879.0], [35.5, 881.0], [35.6, 881.0], [35.7, 882.0], [35.8, 885.0], [35.9, 885.0], [36.0, 888.0], [36.1, 889.0], [36.2, 890.0], [36.3, 893.0], [36.4, 894.0], [36.5, 896.0], [36.6, 897.0], [36.7, 899.0], [36.8, 901.0], [36.9, 901.0], [37.0, 903.0], [37.1, 904.0], [37.2, 905.0], [37.3, 908.0], [37.4, 911.0], [37.5, 913.0], [37.6, 915.0], [37.7, 916.0], [37.8, 917.0], [37.9, 918.0], [38.0, 919.0], [38.1, 919.0], [38.2, 920.0], [38.3, 923.0], [38.4, 924.0], [38.5, 925.0], [38.6, 929.0], [38.7, 929.0], [38.8, 931.0], [38.9, 932.0], [39.0, 932.0], [39.1, 933.0], [39.2, 935.0], [39.3, 935.0], [39.4, 936.0], [39.5, 937.0], [39.6, 940.0], [39.7, 941.0], [39.8, 943.0], [39.9, 944.0], [40.0, 944.0], [40.1, 946.0], [40.2, 948.0], [40.3, 949.0], [40.4, 951.0], [40.5, 952.0], [40.6, 953.0], [40.7, 953.0], [40.8, 955.0], [40.9, 956.0], [41.0, 956.0], [41.1, 960.0], [41.2, 962.0], [41.3, 963.0], [41.4, 964.0], [41.5, 965.0], [41.6, 969.0], [41.7, 969.0], [41.8, 973.0], [41.9, 973.0], [42.0, 975.0], [42.1, 975.0], [42.2, 977.0], [42.3, 978.0], [42.4, 979.0], [42.5, 981.0], [42.6, 984.0], [42.7, 986.0], [42.8, 991.0], [42.9, 993.0], [43.0, 996.0], [43.1, 997.0], [43.2, 998.0], [43.3, 999.0], [43.4, 999.0], [43.5, 999.0], [43.6, 1001.0], [43.7, 1004.0], [43.8, 1005.0], [43.9, 1008.0], [44.0, 1009.0], [44.1, 1010.0], [44.2, 1011.0], [44.3, 1012.0], [44.4, 1016.0], [44.5, 1020.0], [44.6, 1022.0], [44.7, 1023.0], [44.8, 1023.0], [44.9, 1023.0], [45.0, 1025.0], [45.1, 1025.0], [45.2, 1026.0], [45.3, 1026.0], [45.4, 1028.0], [45.5, 1028.0], [45.6, 1035.0], [45.7, 1038.0], [45.8, 1040.0], [45.9, 1040.0], [46.0, 1043.0], [46.1, 1044.0], [46.2, 1045.0], [46.3, 1046.0], [46.4, 1047.0], [46.5, 1048.0], [46.6, 1049.0], [46.7, 1050.0], [46.8, 1054.0], [46.9, 1057.0], [47.0, 1062.0], [47.1, 1067.0], [47.2, 1069.0], [47.3, 1071.0], [47.4, 1075.0], [47.5, 1075.0], [47.6, 1076.0], [47.7, 1079.0], [47.8, 1083.0], [47.9, 1084.0], [48.0, 1087.0], [48.1, 1089.0], [48.2, 1094.0], [48.3, 1096.0], [48.4, 1097.0], [48.5, 1100.0], [48.6, 1107.0], [48.7, 1108.0], [48.8, 1109.0], [48.9, 1111.0], [49.0, 1113.0], [49.1, 1114.0], [49.2, 1115.0], [49.3, 1120.0], [49.4, 1120.0], [49.5, 1122.0], [49.6, 1126.0], [49.7, 1126.0], [49.8, 1127.0], [49.9, 1128.0], [50.0, 1129.0], [50.1, 1132.0], [50.2, 1138.0], [50.3, 1139.0], [50.4, 1144.0], [50.5, 1147.0], [50.6, 1153.0], [50.7, 1157.0], [50.8, 1159.0], [50.9, 1160.0], [51.0, 1163.0], [51.1, 1166.0], [51.2, 1172.0], [51.3, 1174.0], [51.4, 1176.0], [51.5, 1177.0], [51.6, 1179.0], [51.7, 1180.0], [51.8, 1184.0], [51.9, 1185.0], [52.0, 1189.0], [52.1, 1193.0], [52.2, 1197.0], [52.3, 1203.0], [52.4, 1209.0], [52.5, 1215.0], [52.6, 1219.0], [52.7, 1222.0], [52.8, 1223.0], [52.9, 1224.0], [53.0, 1225.0], [53.1, 1225.0], [53.2, 1226.0], [53.3, 1227.0], [53.4, 1231.0], [53.5, 1232.0], [53.6, 1233.0], [53.7, 1235.0], [53.8, 1239.0], [53.9, 1239.0], [54.0, 1242.0], [54.1, 1243.0], [54.2, 1244.0], [54.3, 1247.0], [54.4, 1250.0], [54.5, 1252.0], [54.6, 1254.0], [54.7, 1258.0], [54.8, 1262.0], [54.9, 1270.0], [55.0, 1271.0], [55.1, 1275.0], [55.2, 1282.0], [55.3, 1284.0], [55.4, 1286.0], [55.5, 1287.0], [55.6, 1292.0], [55.7, 1293.0], [55.8, 1294.0], [55.9, 1296.0], [56.0, 1298.0], [56.1, 1300.0], [56.2, 1301.0], [56.3, 1303.0], [56.4, 1315.0], [56.5, 1316.0], [56.6, 1318.0], [56.7, 1319.0], [56.8, 1320.0], [56.9, 1323.0], [57.0, 1324.0], [57.1, 1325.0], [57.2, 1329.0], [57.3, 1331.0], [57.4, 1334.0], [57.5, 1336.0], [57.6, 1340.0], [57.7, 1342.0], [57.8, 1346.0], [57.9, 1350.0], [58.0, 1352.0], [58.1, 1353.0], [58.2, 1361.0], [58.3, 1364.0], [58.4, 1365.0], [58.5, 1369.0], [58.6, 1376.0], [58.7, 1378.0], [58.8, 1382.0], [58.9, 1388.0], [59.0, 1401.0], [59.1, 1402.0], [59.2, 1404.0], [59.3, 1405.0], [59.4, 1408.0], [59.5, 1412.0], [59.6, 1417.0], [59.7, 1419.0], [59.8, 1429.0], [59.9, 1430.0], [60.0, 1432.0], [60.1, 1435.0], [60.2, 1439.0], [60.3, 1440.0], [60.4, 1441.0], [60.5, 1445.0], [60.6, 1447.0], [60.7, 1450.0], [60.8, 1454.0], [60.9, 1454.0], [61.0, 1457.0], [61.1, 1458.0], [61.2, 1461.0], [61.3, 1461.0], [61.4, 1464.0], [61.5, 1470.0], [61.6, 1479.0], [61.7, 1482.0], [61.8, 1485.0], [61.9, 1486.0], [62.0, 1498.0], [62.1, 1499.0], [62.2, 1502.0], [62.3, 1506.0], [62.4, 1520.0], [62.5, 1523.0], [62.6, 1526.0], [62.7, 1529.0], [62.8, 1537.0], [62.9, 1538.0], [63.0, 1539.0], [63.1, 1544.0], [63.2, 1551.0], [63.3, 1553.0], [63.4, 1559.0], [63.5, 1562.0], [63.6, 1564.0], [63.7, 1566.0], [63.8, 1572.0], [63.9, 1575.0], [64.0, 1580.0], [64.1, 1585.0], [64.2, 1593.0], [64.3, 1595.0], [64.4, 1604.0], [64.5, 1605.0], [64.6, 1617.0], [64.7, 1618.0], [64.8, 1621.0], [64.9, 1627.0], [65.0, 1632.0], [65.1, 1633.0], [65.2, 1637.0], [65.3, 1638.0], [65.4, 1640.0], [65.5, 1640.0], [65.6, 1644.0], [65.7, 1646.0], [65.8, 1647.0], [65.9, 1652.0], [66.0, 1658.0], [66.1, 1664.0], [66.2, 1669.0], [66.3, 1677.0], [66.4, 1681.0], [66.5, 1685.0], [66.6, 1690.0], [66.7, 1695.0], [66.8, 1703.0], [66.9, 1705.0], [67.0, 1711.0], [67.1, 1716.0], [67.2, 1723.0], [67.3, 1724.0], [67.4, 1730.0], [67.5, 1738.0], [67.6, 1738.0], [67.7, 1740.0], [67.8, 1746.0], [67.9, 1747.0], [68.0, 1752.0], [68.1, 1753.0], [68.2, 1756.0], [68.3, 1758.0], [68.4, 1761.0], [68.5, 1766.0], [68.6, 1783.0], [68.7, 1793.0], [68.8, 1797.0], [68.9, 1798.0], [69.0, 1800.0], [69.1, 1803.0], [69.2, 1826.0], [69.3, 1833.0], [69.4, 1840.0], [69.5, 1845.0], [69.6, 1849.0], [69.7, 1858.0], [69.8, 1869.0], [69.9, 1870.0], [70.0, 1874.0], [70.1, 1883.0], [70.2, 1888.0], [70.3, 1893.0], [70.4, 1900.0], [70.5, 1901.0], [70.6, 1905.0], [70.7, 1914.0], [70.8, 1927.0], [70.9, 1930.0], [71.0, 1938.0], [71.1, 1941.0], [71.2, 1945.0], [71.3, 1947.0], [71.4, 1958.0], [71.5, 1961.0], [71.6, 1965.0], [71.7, 1979.0], [71.8, 1982.0], [71.9, 1996.0], [72.0, 1999.0], [72.1, 2008.0], [72.2, 2026.0], [72.3, 2028.0], [72.4, 2038.0], [72.5, 2040.0], [72.6, 2044.0], [72.7, 2047.0], [72.8, 2051.0], [72.9, 2055.0], [73.0, 2064.0], [73.1, 2068.0], [73.2, 2080.0], [73.3, 2090.0], [73.4, 2104.0], [73.5, 2116.0], [73.6, 2120.0], [73.7, 2126.0], [73.8, 2129.0], [73.9, 2144.0], [74.0, 2148.0], [74.1, 2156.0], [74.2, 2159.0], [74.3, 2181.0], [74.4, 2181.0], [74.5, 2189.0], [74.6, 2202.0], [74.7, 2211.0], [74.8, 2225.0], [74.9, 2230.0], [75.0, 2234.0], [75.1, 2251.0], [75.2, 2254.0], [75.3, 2264.0], [75.4, 2274.0], [75.5, 2295.0], [75.6, 2304.0], [75.7, 2309.0], [75.8, 2314.0], [75.9, 2317.0], [76.0, 2317.0], [76.1, 2320.0], [76.2, 2329.0], [76.3, 2340.0], [76.4, 2347.0], [76.5, 2355.0], [76.6, 2357.0], [76.7, 2363.0], [76.8, 2363.0], [76.9, 2383.0], [77.0, 2389.0], [77.1, 2398.0], [77.2, 2422.0], [77.3, 2434.0], [77.4, 2442.0], [77.5, 2460.0], [77.6, 2472.0], [77.7, 2484.0], [77.8, 2489.0], [77.9, 2496.0], [78.0, 2519.0], [78.1, 2536.0], [78.2, 2546.0], [78.3, 2564.0], [78.4, 2584.0], [78.5, 2598.0], [78.6, 2623.0], [78.7, 2643.0], [78.8, 2657.0], [78.9, 2669.0], [79.0, 2673.0], [79.1, 2714.0], [79.2, 2726.0], [79.3, 2750.0], [79.4, 2757.0], [79.5, 2761.0], [79.6, 2763.0], [79.7, 2782.0], [79.8, 2792.0], [79.9, 2801.0], [80.0, 2808.0], [80.1, 2819.0], [80.2, 2823.0], [80.3, 2831.0], [80.4, 2836.0], [80.5, 2861.0], [80.6, 2887.0], [80.7, 2930.0], [80.8, 2935.0], [80.9, 2956.0], [81.0, 2964.0], [81.1, 2977.0], [81.2, 2994.0], [81.3, 3027.0], [81.4, 3045.0], [81.5, 3059.0], [81.6, 3079.0], [81.7, 3102.0], [81.8, 3105.0], [81.9, 3124.0], [82.0, 3138.0], [82.1, 3169.0], [82.2, 3190.0], [82.3, 3206.0], [82.4, 3227.0], [82.5, 3240.0], [82.6, 3245.0], [82.7, 3262.0], [82.8, 3264.0], [82.9, 3282.0], [83.0, 3286.0], [83.1, 3293.0], [83.2, 3306.0], [83.3, 3316.0], [83.4, 3347.0], [83.5, 3386.0], [83.6, 3401.0], [83.7, 3411.0], [83.8, 3413.0], [83.9, 3434.0], [84.0, 3451.0], [84.1, 3488.0], [84.2, 3493.0], [84.3, 3520.0], [84.4, 3527.0], [84.5, 3547.0], [84.6, 3571.0], [84.7, 3580.0], [84.8, 3583.0], [84.9, 3596.0], [85.0, 3598.0], [85.1, 3634.0], [85.2, 3641.0], [85.3, 3645.0], [85.4, 3661.0], [85.5, 3667.0], [85.6, 3682.0], [85.7, 3697.0], [85.8, 3735.0], [85.9, 3767.0], [86.0, 3775.0], [86.1, 3826.0], [86.2, 3838.0], [86.3, 3854.0], [86.4, 3868.0], [86.5, 3881.0], [86.6, 3891.0], [86.7, 3897.0], [86.8, 3900.0], [86.9, 3908.0], [87.0, 3910.0], [87.1, 3916.0], [87.2, 3919.0], [87.3, 3930.0], [87.4, 3935.0], [87.5, 3950.0], [87.6, 3969.0], [87.7, 3994.0], [87.8, 4014.0], [87.9, 4051.0], [88.0, 4064.0], [88.1, 4104.0], [88.2, 4115.0], [88.3, 4129.0], [88.4, 4148.0], [88.5, 4158.0], [88.6, 4179.0], [88.7, 4196.0], [88.8, 4225.0], [88.9, 4282.0], [89.0, 4293.0], [89.1, 4309.0], [89.2, 4338.0], [89.3, 4383.0], [89.4, 4401.0], [89.5, 4430.0], [89.6, 4468.0], [89.7, 4489.0], [89.8, 4496.0], [89.9, 4523.0], [90.0, 4584.0], [90.1, 4594.0], [90.2, 4611.0], [90.3, 4632.0], [90.4, 4657.0], [90.5, 4687.0], [90.6, 4695.0], [90.7, 4731.0], [90.8, 4734.0], [90.9, 4759.0], [91.0, 4761.0], [91.1, 4846.0], [91.2, 4884.0], [91.3, 4943.0], [91.4, 4952.0], [91.5, 5019.0], [91.6, 5038.0], [91.7, 5154.0], [91.8, 5199.0], [91.9, 5221.0], [92.0, 5235.0], [92.1, 5299.0], [92.2, 5305.0], [92.3, 5324.0], [92.4, 5327.0], [92.5, 5346.0], [92.6, 5350.0], [92.7, 5391.0], [92.8, 5391.0], [92.9, 5427.0], [93.0, 5466.0], [93.1, 5492.0], [93.2, 5556.0], [93.3, 5620.0], [93.4, 5650.0], [93.5, 5659.0], [93.6, 5680.0], [93.7, 5718.0], [93.8, 5763.0], [93.9, 5896.0], [94.0, 5942.0], [94.1, 6016.0], [94.2, 6105.0], [94.3, 6130.0], [94.4, 6155.0], [94.5, 6230.0], [94.6, 6264.0], [94.7, 6291.0], [94.8, 6351.0], [94.9, 6386.0], [95.0, 6404.0], [95.1, 6441.0], [95.2, 6523.0], [95.3, 6624.0], [95.4, 6657.0], [95.5, 6673.0], [95.6, 6699.0], [95.7, 6746.0], [95.8, 6897.0], [95.9, 6970.0], [96.0, 7005.0], [96.1, 7058.0], [96.2, 7110.0], [96.3, 7243.0], [96.4, 7279.0], [96.5, 7363.0], [96.6, 7448.0], [96.7, 7540.0], [96.8, 7571.0], [96.9, 7752.0], [97.0, 7849.0], [97.1, 7959.0], [97.2, 7981.0], [97.3, 8199.0], [97.4, 8398.0], [97.5, 8535.0], [97.6, 8575.0], [97.7, 8618.0], [97.8, 8677.0], [97.9, 8854.0], [98.0, 8910.0], [98.1, 9020.0], [98.2, 9143.0], [98.3, 9513.0], [98.4, 9931.0], [98.5, 10040.0], [98.6, 10068.0], [98.7, 10223.0], [98.8, 10420.0], [98.9, 10745.0], [99.0, 10828.0], [99.1, 11481.0], [99.2, 11579.0], [99.3, 11687.0], [99.4, 12205.0], [99.5, 12302.0], [99.6, 12371.0], [99.7, 13036.0], [99.8, 14141.0], [99.9, 16143.0], [100.0, 18654.0]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
        getOptions: function() {
            return {
                series: {
                    points: { show: false }
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentiles'
                },
                xaxis: {
                    tickDecimals: 1,
                    axisLabel: "Percentiles",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Percentile value in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : %x.2 percentile was %y ms"
                },
                selection: { mode: "xy" },
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentiles"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesPercentiles"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesPercentiles"), dataset, prepareOverviewOptions(options));
        }
};

/**
 * @param elementId Id of element where we display message
 */
function setEmptyGraph(elementId) {
    $(function() {
        $(elementId).text("No graph series with filter="+seriesFilter);
    });
}

// Response times percentiles
function refreshResponseTimePercentiles() {
    var infos = responseTimePercentilesInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimePercentiles");
        return;
    }
    if (isGraph($("#flotResponseTimesPercentiles"))){
        infos.createGraph();
    } else {
        var choiceContainer = $("#choicesResponseTimePercentiles");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesPercentiles", "#overviewResponseTimesPercentiles");
        $('#bodyResponseTimePercentiles .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimeDistributionInfos = {
        data: {"result": {"minY": 1.0, "minX": 100.0, "maxY": 204.0, "series": [{"data": [[100.0, 24.0], [200.0, 94.0], [300.0, 70.0], [400.0, 48.0], [500.0, 204.0], [600.0, 182.0], [700.0, 140.0], [800.0, 156.0], [900.0, 170.0], [1000.0, 124.0], [1100.0, 94.0], [1200.0, 96.0], [1300.0, 72.0], [1400.0, 79.0], [1500.0, 56.0], [1600.0, 61.0], [1700.0, 55.0], [1800.0, 35.0], [1900.0, 41.0], [2000.0, 32.0], [2100.0, 30.0], [2200.0, 25.0], [2300.0, 40.0], [2400.0, 20.0], [2500.0, 15.0], [2600.0, 14.0], [2700.0, 20.0], [2800.0, 18.0], [2900.0, 15.0], [3000.0, 12.0], [3100.0, 15.0], [3300.0, 10.0], [3200.0, 22.0], [3400.0, 17.0], [3500.0, 19.0], [3700.0, 7.0], [3600.0, 18.0], [3800.0, 19.0], [3900.0, 24.0], [4000.0, 9.0], [4100.0, 16.0], [4300.0, 6.0], [4200.0, 9.0], [4600.0, 12.0], [4400.0, 12.0], [4500.0, 8.0], [4700.0, 11.0], [4800.0, 4.0], [4900.0, 7.0], [5100.0, 5.0], [5000.0, 3.0], [5200.0, 9.0], [5300.0, 16.0], [5500.0, 3.0], [5600.0, 9.0], [5400.0, 8.0], [5700.0, 6.0], [5800.0, 2.0], [5900.0, 4.0], [6100.0, 6.0], [6000.0, 2.0], [6300.0, 5.0], [6200.0, 8.0], [6600.0, 8.0], [6400.0, 5.0], [6500.0, 4.0], [6700.0, 4.0], [6900.0, 4.0], [6800.0, 1.0], [7000.0, 5.0], [7100.0, 2.0], [7200.0, 5.0], [7400.0, 2.0], [7300.0, 3.0], [7500.0, 5.0], [7600.0, 1.0], [7800.0, 3.0], [7900.0, 5.0], [7700.0, 1.0], [8000.0, 1.0], [8100.0, 1.0], [8600.0, 6.0], [8700.0, 1.0], [8500.0, 4.0], [8300.0, 1.0], [8400.0, 1.0], [8200.0, 1.0], [8800.0, 2.0], [8900.0, 3.0], [9100.0, 1.0], [9000.0, 2.0], [9500.0, 1.0], [9400.0, 2.0], [10000.0, 3.0], [10200.0, 1.0], [10100.0, 2.0], [9800.0, 1.0], [9900.0, 3.0], [10300.0, 1.0], [10700.0, 2.0], [10400.0, 2.0], [10600.0, 1.0], [10800.0, 1.0], [11600.0, 2.0], [11400.0, 4.0], [11700.0, 1.0], [11500.0, 2.0], [12200.0, 3.0], [12600.0, 1.0], [12300.0, 3.0], [13000.0, 2.0], [13500.0, 1.0], [14100.0, 1.0], [14200.0, 1.0], [14900.0, 1.0], [16100.0, 1.0], [17800.0, 1.0], [18600.0, 1.0]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 18600.0, "title": "Response Time Distribution"}},
        getOptions: function() {
            var granularity = this.data.result.granularity;
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    barWidth: this.data.result.granularity
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " responses for " + label + " were between " + xval + " and " + (xval + granularity) + " ms";
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimeDistribution"), prepareData(data.result.series, $("#choicesResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshResponseTimeDistribution() {
    var infos = responseTimeDistributionInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeDistribution");
        return;
    }
    if (isGraph($("#flotResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var syntheticResponseTimeDistributionInfos = {
        data: {"result": {"minY": 237.0, "minX": 0.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 1317.0, "series": [{"data": [[0.0, 237.0]], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [[1.0, 1317.0]], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [[2.0, 946.0]], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 2.0, "title": "Synthetic Response Times Distribution"}},
        getOptions: function() {
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendSyntheticResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times ranges",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                    tickLength:0,
                    min:-0.5,
                    max:3.5
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    align: "center",
                    barWidth: 0.25,
                    fill:.75
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " " + label;
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            options.xaxis.ticks = data.result.ticks;
            $.plot($("#flotSyntheticResponseTimeDistribution"), prepareData(data.result.series, $("#choicesSyntheticResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshSyntheticResponseTimeDistribution() {
    var infos = syntheticResponseTimeDistributionInfos;
    prepareSeries(infos.data, true);
    if (isGraph($("#flotSyntheticResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerSyntheticResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var activeThreadsOverTimeInfos = {
        data: {"result": {"minY": 35.51437699680509, "minX": 1.76503668E12, "maxY": 50.0, "series": [{"data": [[1.76503674E12, 50.0], [1.76503668E12, 35.51437699680509], [1.7650368E12, 40.18815789473685]], "isOverall": false, "label": "Thread Group", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7650368E12, "title": "Active Threads Over Time"}},
        getOptions: function() {
            return {
                series: {
                    stack: true,
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 6,
                    show: true,
                    container: '#legendActiveThreadsOverTime'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                selection: {
                    mode: 'xy'
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : At %x there were %y active threads"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesActiveThreadsOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotActiveThreadsOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewActiveThreadsOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Active Threads Over Time
function refreshActiveThreadsOverTime(fixTimestamps) {
    var infos = activeThreadsOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotActiveThreadsOverTime"))) {
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesActiveThreadsOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotActiveThreadsOverTime", "#overviewActiveThreadsOverTime");
        $('#footerActiveThreadsOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var timeVsThreadsInfos = {
        data: {"result": {"minY": 184.33333333333337, "minX": 1.0, "maxY": 3728.7142857142853, "series": [{"data": [[2.0, 395.5], [3.0, 225.2], [4.0, 184.33333333333337], [5.0, 309.0], [6.0, 595.125], [7.0, 250.26315789473685], [8.0, 566.375], [9.0, 403.1111111111111], [10.0, 442.57142857142856], [11.0, 740.5], [12.0, 609.0], [13.0, 321.0], [14.0, 900.7142857142857], [15.0, 1819.6666666666667], [16.0, 540.0], [17.0, 304.5], [18.0, 278.5], [19.0, 323.0], [20.0, 564.0], [21.0, 573.3076923076923], [22.0, 3728.7142857142853], [23.0, 2823.285714285714], [24.0, 1631.7], [25.0, 1461.0], [26.0, 800.1818181818181], [27.0, 814.25], [28.0, 526.0], [29.0, 2408.875], [30.0, 501.66666666666663], [31.0, 621.0], [33.0, 830.3], [32.0, 507.7], [34.0, 1671.4629629629637], [35.0, 869.0], [37.0, 3048.0499999999997], [36.0, 1749.8], [38.0, 3036.333333333333], [39.0, 1814.9245283018868], [40.0, 2047.758620689655], [41.0, 2643.5217391304345], [42.0, 1928.723404255319], [43.0, 1061.5862068965512], [44.0, 1070.5555555555557], [45.0, 1173.6296296296293], [46.0, 1064.7264150943392], [47.0, 2514.056179775281], [49.0, 1531.3076923076922], [48.0, 2339.695364238411], [50.0, 2158.2543802725495], [1.0, 227.0]], "isOverall": false, "label": "HTTP Request", "isController": false}, {"data": [[45.203599999999945, 1951.915599999999]], "isOverall": false, "label": "HTTP Request-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 50.0, "title": "Time VS Threads"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: { noColumns: 2,show: true, container: '#legendTimeVsThreads' },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s: At %x.2 active threads, Average response time was %y.2 ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesTimeVsThreads"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotTimesVsThreads"), dataset, options);
            // setup overview
            $.plot($("#overviewTimesVsThreads"), dataset, prepareOverviewOptions(options));
        }
};

// Time vs threads
function refreshTimeVsThreads(){
    var infos = timeVsThreadsInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTimeVsThreads");
        return;
    }
    if(isGraph($("#flotTimesVsThreads"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTimeVsThreads");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTimesVsThreads", "#overviewTimesVsThreads");
        $('#footerTimeVsThreads .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var bytesThroughputOverTimeInfos = {
        data : {"result": {"minY": 683.3833333333333, "minX": 1.76503668E12, "maxY": 11273.3, "series": [{"data": [[1.76503674E12, 11273.3], [1.76503668E12, 2472.7], [1.7650368E12, 6004.0]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.76503674E12, 3115.616666666667], [1.76503668E12, 683.3833333333333], [1.7650368E12, 1659.3333333333333]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7650368E12, "title": "Bytes Throughput Over Time"}},
        getOptions : function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity) ,
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Bytes / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendBytesThroughputOverTime'
                },
                selection: {
                    mode: "xy"
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y"
                }
            };
        },
        createGraph : function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesBytesThroughputOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotBytesThroughputOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewBytesThroughputOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Bytes throughput Over Time
function refreshBytesThroughputOverTime(fixTimestamps) {
    var infos = bytesThroughputOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotBytesThroughputOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesBytesThroughputOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotBytesThroughputOverTime", "#overviewBytesThroughputOverTime");
        $('#footerBytesThroughputOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimesOverTimeInfos = {
        data: {"result": {"minY": 1632.3447368421055, "minX": 1.76503668E12, "maxY": 2147.217939733711, "series": [{"data": [[1.76503674E12, 2147.217939733711], [1.76503668E12, 1837.4664536741209], [1.7650368E12, 1632.3447368421055]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7650368E12, "title": "Response Time Over Time"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average response time was %y ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Times Over Time
function refreshResponseTimeOverTime(fixTimestamps) {
    var infos = responseTimesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotResponseTimesOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesOverTime", "#overviewResponseTimesOverTime");
        $('#footerResponseTimesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var latenciesOverTimeInfos = {
        data: {"result": {"minY": 1632.071052631579, "minX": 1.76503668E12, "maxY": 2146.9621583742132, "series": [{"data": [[1.76503674E12, 2146.9621583742132], [1.76503668E12, 1836.9009584664552], [1.7650368E12, 1632.071052631579]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7650368E12, "title": "Latencies Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response latencies in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendLatenciesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average latency was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesLatenciesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotLatenciesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewLatenciesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Latencies Over Time
function refreshLatenciesOverTime(fixTimestamps) {
    var infos = latenciesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyLatenciesOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotLatenciesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesLatenciesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotLatenciesOverTime", "#overviewLatenciesOverTime");
        $('#footerLatenciesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var connectTimeOverTimeInfos = {
        data: {"result": {"minY": 0.01973684210526318, "minX": 1.76503668E12, "maxY": 0.5878594249201281, "series": [{"data": [[1.76503674E12, 0.11632796075683251], [1.76503668E12, 0.5878594249201281], [1.7650368E12, 0.01973684210526318]], "isOverall": false, "label": "HTTP Request", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7650368E12, "title": "Connect Time Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getConnectTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average Connect Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendConnectTimeOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average connect time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesConnectTimeOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotConnectTimeOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewConnectTimeOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Connect Time Over Time
function refreshConnectTimeOverTime(fixTimestamps) {
    var infos = connectTimeOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyConnectTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotConnectTimeOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesConnectTimeOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotConnectTimeOverTime", "#overviewConnectTimeOverTime");
        $('#footerConnectTimeOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var responseTimePercentilesOverTimeInfos = {
        data: {"result": {"minY": 167.0, "minX": 1.76503668E12, "maxY": 18654.0, "series": [{"data": [[1.76503674E12, 18654.0], [1.76503668E12, 7819.0], [1.7650368E12, 10624.0]], "isOverall": false, "label": "Max", "isController": false}, {"data": [[1.76503674E12, 167.0], [1.76503668E12, 175.0], [1.7650368E12, 181.0]], "isOverall": false, "label": "Min", "isController": false}, {"data": [[1.76503674E12, 5324.6], [1.76503668E12, 4100.000000000001], [1.7650368E12, 3755.6999999999994]], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [[1.76503674E12, 12277.720000000001], [1.76503668E12, 6716.280000000002], [1.7650368E12, 7975.51]], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [[1.76503674E12, 1175.0], [1.76503668E12, 1412.0], [1.7650368E12, 1009.0]], "isOverall": false, "label": "Median", "isController": false}, {"data": [[1.76503674E12, 7566.999999999999], [1.76503668E12, 5064.9000000000015], [1.7650368E12, 5335.4]], "isOverall": false, "label": "95th percentile", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7650368E12, "title": "Response Time Percentiles Over Time (successful requests only)"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Response Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentilesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Response time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentilesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimePercentilesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimePercentilesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Time Percentiles Over Time
function refreshResponseTimePercentilesOverTime(fixTimestamps) {
    var infos = responseTimePercentilesOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotResponseTimePercentilesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimePercentilesOverTime", "#overviewResponseTimePercentilesOverTime");
        $('#footerResponseTimePercentilesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var responseTimeVsRequestInfos = {
    data: {"result": {"minY": 309.0, "minX": 2.0, "maxY": 5896.0, "series": [{"data": [[2.0, 5781.5], [34.0, 1659.5], [36.0, 1308.5], [37.0, 878.0], [39.0, 1414.5], [38.0, 1053.5], [41.0, 1025.0], [40.0, 845.0], [42.0, 1143.0], [46.0, 895.0], [47.0, 1010.0], [3.0, 5896.0], [49.0, 1114.0], [50.0, 1127.0], [51.0, 1297.0], [52.0, 732.5], [53.0, 801.0], [55.0, 960.0], [57.0, 865.0], [4.0, 3510.0], [5.0, 408.0], [6.0, 2722.0], [7.0, 3488.0], [8.0, 2260.0], [9.0, 5459.5], [10.0, 3887.0], [12.0, 2149.0], [13.0, 1540.0], [14.0, 2267.0], [17.0, 415.0], [19.0, 1695.0], [20.0, 2953.5], [22.0, 309.0], [23.0, 804.0], [24.0, 1295.5], [26.0, 3054.5], [27.0, 1901.0], [28.0, 1134.5], [29.0, 1081.0], [30.0, 1797.5], [31.0, 1334.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 57.0, "title": "Response Time Vs Request"}},
    getOptions: function() {
        return {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Response Time in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: {
                noColumns: 2,
                show: true,
                container: '#legendResponseTimeVsRequest'
            },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median response time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesResponseTimeVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotResponseTimeVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewResponseTimeVsRequest"), dataset, prepareOverviewOptions(options));

    }
};

// Response Time vs Request
function refreshResponseTimeVsRequest() {
    var infos = responseTimeVsRequestInfos;
    prepareSeries(infos.data);
    if (isGraph($("#flotResponseTimeVsRequest"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeVsRequest");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimeVsRequest", "#overviewResponseTimeVsRequest");
        $('#footerResponseRimeVsRequest .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var latenciesVsRequestInfos = {
    data: {"result": {"minY": 309.0, "minX": 2.0, "maxY": 5895.0, "series": [{"data": [[2.0, 5781.5], [34.0, 1659.5], [36.0, 1308.5], [37.0, 878.0], [39.0, 1414.5], [38.0, 1053.0], [41.0, 1025.0], [40.0, 844.5], [42.0, 1143.0], [46.0, 895.0], [47.0, 1010.0], [3.0, 5895.0], [49.0, 1114.0], [50.0, 1127.0], [51.0, 1297.0], [52.0, 732.5], [53.0, 801.0], [55.0, 959.5], [57.0, 864.5], [4.0, 3510.0], [5.0, 407.0], [6.0, 2721.5], [7.0, 3488.0], [8.0, 2259.5], [9.0, 5458.5], [10.0, 3887.0], [12.0, 2149.0], [13.0, 1540.0], [14.0, 2266.5], [17.0, 414.0], [19.0, 1695.0], [20.0, 2952.5], [22.0, 309.0], [23.0, 804.0], [24.0, 1294.5], [26.0, 3054.5], [27.0, 1901.0], [28.0, 1134.0], [29.0, 1080.0], [30.0, 1797.5], [31.0, 1334.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 57.0, "title": "Latencies Vs Request"}},
    getOptions: function() {
        return{
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Latency in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: { noColumns: 2,show: true, container: '#legendLatencyVsRequest' },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median Latency time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesLatencyVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotLatenciesVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewLatenciesVsRequest"), dataset, prepareOverviewOptions(options));
    }
};

// Latencies vs Request
function refreshLatenciesVsRequest() {
        var infos = latenciesVsRequestInfos;
        prepareSeries(infos.data);
        if(isGraph($("#flotLatenciesVsRequest"))){
            infos.createGraph();
        }else{
            var choiceContainer = $("#choicesLatencyVsRequest");
            createLegend(choiceContainer, infos);
            infos.createGraph();
            setGraphZoomable("#flotLatenciesVsRequest", "#overviewLatenciesVsRequest");
            $('#footerLatenciesVsRequest .legendColorBox > div').each(function(i){
                $(this).clone().prependTo(choiceContainer.find("li").eq(i));
            });
        }
};

var hitsPerSecondInfos = {
        data: {"result": {"minY": 6.05, "minX": 1.76503668E12, "maxY": 23.783333333333335, "series": [{"data": [[1.76503674E12, 23.783333333333335], [1.76503668E12, 6.05], [1.7650368E12, 11.833333333333334]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7650368E12, "title": "Hits Per Second"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of hits / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendHitsPerSecond"
                },
                selection: {
                    mode : 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y.2 hits/sec"
                }
            };
        },
        createGraph: function createGraph() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesHitsPerSecond"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotHitsPerSecond"), dataset, options);
            // setup overview
            $.plot($("#overviewHitsPerSecond"), dataset, prepareOverviewOptions(options));
        }
};

// Hits per second
function refreshHitsPerSecond(fixTimestamps) {
    var infos = hitsPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if (isGraph($("#flotHitsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesHitsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotHitsPerSecond", "#overviewHitsPerSecond");
        $('#footerHitsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var codesPerSecondInfos = {
        data: {"result": {"minY": 5.216666666666667, "minX": 1.76503668E12, "maxY": 23.783333333333335, "series": [{"data": [[1.76503674E12, 23.783333333333335], [1.76503668E12, 5.216666666666667], [1.7650368E12, 12.666666666666666]], "isOverall": false, "label": "200", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.7650368E12, "title": "Codes Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendCodesPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "Number of Response Codes %s at %x was %y.2 responses / sec"
                }
            };
        },
    createGraph: function() {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesCodesPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotCodesPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewCodesPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Codes per second
function refreshCodesPerSecond(fixTimestamps) {
    var infos = codesPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotCodesPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesCodesPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotCodesPerSecond", "#overviewCodesPerSecond");
        $('#footerCodesPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var transactionsPerSecondInfos = {
        data: {"result": {"minY": 5.216666666666667, "minX": 1.76503668E12, "maxY": 23.783333333333335, "series": [{"data": [[1.76503674E12, 23.783333333333335], [1.76503668E12, 5.216666666666667], [1.7650368E12, 12.666666666666666]], "isOverall": false, "label": "HTTP Request-success", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7650368E12, "title": "Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTransactionsPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                }
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTransactionsPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTransactionsPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewTransactionsPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Transactions per second
function refreshTransactionsPerSecond(fixTimestamps) {
    var infos = transactionsPerSecondInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTransactionsPerSecond");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotTransactionsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTransactionsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTransactionsPerSecond", "#overviewTransactionsPerSecond");
        $('#footerTransactionsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var totalTPSInfos = {
        data: {"result": {"minY": 5.216666666666667, "minX": 1.76503668E12, "maxY": 23.783333333333335, "series": [{"data": [[1.76503674E12, 23.783333333333335], [1.76503668E12, 5.216666666666667], [1.7650368E12, 12.666666666666666]], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.7650368E12, "title": "Total Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTotalTPS"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                },
                colors: ["#9ACD32", "#FF6347"]
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTotalTPS"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTotalTPS"), dataset, options);
        // setup overview
        $.plot($("#overviewTotalTPS"), dataset, prepareOverviewOptions(options));
    }
};

// Total Transactions per second
function refreshTotalTPS(fixTimestamps) {
    var infos = totalTPSInfos;
    // We want to ignore seriesFilter
    prepareSeries(infos.data, false, true);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -18000000);
    }
    if(isGraph($("#flotTotalTPS"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTotalTPS");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTotalTPS", "#overviewTotalTPS");
        $('#footerTotalTPS .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

// Collapse the graph matching the specified DOM element depending the collapsed
// status
function collapse(elem, collapsed){
    if(collapsed){
        $(elem).parent().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
        $(elem).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (elem.id == "bodyBytesThroughputOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshBytesThroughputOverTime(true);
            }
            document.location.href="#bytesThroughputOverTime";
        } else if (elem.id == "bodyLatenciesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesOverTime(true);
            }
            document.location.href="#latenciesOverTime";
        } else if (elem.id == "bodyCustomGraph") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCustomGraph(true);
            }
            document.location.href="#responseCustomGraph";
        } else if (elem.id == "bodyConnectTimeOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshConnectTimeOverTime(true);
            }
            document.location.href="#connectTimeOverTime";
        } else if (elem.id == "bodyResponseTimePercentilesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimePercentilesOverTime(true);
            }
            document.location.href="#responseTimePercentilesOverTime";
        } else if (elem.id == "bodyResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeDistribution();
            }
            document.location.href="#responseTimeDistribution" ;
        } else if (elem.id == "bodySyntheticResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshSyntheticResponseTimeDistribution();
            }
            document.location.href="#syntheticResponseTimeDistribution" ;
        } else if (elem.id == "bodyActiveThreadsOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshActiveThreadsOverTime(true);
            }
            document.location.href="#activeThreadsOverTime";
        } else if (elem.id == "bodyTimeVsThreads") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTimeVsThreads();
            }
            document.location.href="#timeVsThreads" ;
        } else if (elem.id == "bodyCodesPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCodesPerSecond(true);
            }
            document.location.href="#codesPerSecond";
        } else if (elem.id == "bodyTransactionsPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTransactionsPerSecond(true);
            }
            document.location.href="#transactionsPerSecond";
        } else if (elem.id == "bodyTotalTPS") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTotalTPS(true);
            }
            document.location.href="#totalTPS";
        } else if (elem.id == "bodyResponseTimeVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeVsRequest();
            }
            document.location.href="#responseTimeVsRequest";
        } else if (elem.id == "bodyLatenciesVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesVsRequest();
            }
            document.location.href="#latencyVsRequest";
        }
    }
}

/*
 * Activates or deactivates all series of the specified graph (represented by id parameter)
 * depending on checked argument.
 */
function toggleAll(id, checked){
    var placeholder = document.getElementById(id);

    var cases = $(placeholder).find(':checkbox');
    cases.prop('checked', checked);
    $(cases).parent().children().children().toggleClass("legend-disabled", !checked);

    var choiceContainer;
    if ( id == "choicesBytesThroughputOverTime"){
        choiceContainer = $("#choicesBytesThroughputOverTime");
        refreshBytesThroughputOverTime(false);
    } else if(id == "choicesResponseTimesOverTime"){
        choiceContainer = $("#choicesResponseTimesOverTime");
        refreshResponseTimeOverTime(false);
    }else if(id == "choicesResponseCustomGraph"){
        choiceContainer = $("#choicesResponseCustomGraph");
        refreshCustomGraph(false);
    } else if ( id == "choicesLatenciesOverTime"){
        choiceContainer = $("#choicesLatenciesOverTime");
        refreshLatenciesOverTime(false);
    } else if ( id == "choicesConnectTimeOverTime"){
        choiceContainer = $("#choicesConnectTimeOverTime");
        refreshConnectTimeOverTime(false);
    } else if ( id == "choicesResponseTimePercentilesOverTime"){
        choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        refreshResponseTimePercentilesOverTime(false);
    } else if ( id == "choicesResponseTimePercentiles"){
        choiceContainer = $("#choicesResponseTimePercentiles");
        refreshResponseTimePercentiles();
    } else if(id == "choicesActiveThreadsOverTime"){
        choiceContainer = $("#choicesActiveThreadsOverTime");
        refreshActiveThreadsOverTime(false);
    } else if ( id == "choicesTimeVsThreads"){
        choiceContainer = $("#choicesTimeVsThreads");
        refreshTimeVsThreads();
    } else if ( id == "choicesSyntheticResponseTimeDistribution"){
        choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        refreshSyntheticResponseTimeDistribution();
    } else if ( id == "choicesResponseTimeDistribution"){
        choiceContainer = $("#choicesResponseTimeDistribution");
        refreshResponseTimeDistribution();
    } else if ( id == "choicesHitsPerSecond"){
        choiceContainer = $("#choicesHitsPerSecond");
        refreshHitsPerSecond(false);
    } else if(id == "choicesCodesPerSecond"){
        choiceContainer = $("#choicesCodesPerSecond");
        refreshCodesPerSecond(false);
    } else if ( id == "choicesTransactionsPerSecond"){
        choiceContainer = $("#choicesTransactionsPerSecond");
        refreshTransactionsPerSecond(false);
    } else if ( id == "choicesTotalTPS"){
        choiceContainer = $("#choicesTotalTPS");
        refreshTotalTPS(false);
    } else if ( id == "choicesResponseTimeVsRequest"){
        choiceContainer = $("#choicesResponseTimeVsRequest");
        refreshResponseTimeVsRequest();
    } else if ( id == "choicesLatencyVsRequest"){
        choiceContainer = $("#choicesLatencyVsRequest");
        refreshLatenciesVsRequest();
    }
    var color = checked ? "black" : "#818181";
    if(choiceContainer != null) {
        choiceContainer.find("label").each(function(){
            this.style.color = color;
        });
    }
}

