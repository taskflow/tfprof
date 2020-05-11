const simple = [
{
  "executor": "executor 0",
  "data": [
    {
      "worker": "worker 1",
      "data": [
        {
          "timeRange": [2,7],
          "name": "t1",
          "type": "static"
        },
        {
          "timeRange": [9,13],
          "name": "t2",
          "type": "static"
        },
        {
          "timeRange": [15,20],
          "name": "t3",
          "type": "static"
        },
        {
          "timeRange": [22,27],
          "name": "t4",
          "type": "static"
        },
        {
          "timeRange": [29,34],
          "name": "t5",
          "type": "static"
        },
        {
          "timeRange": [36,40],
          "name": "t6",
          "type": "static"
        }
      ]
    },
    {
      "worker": "worker 2",
      "data":[
        {
          "timeRange": [4,5],
          "name": "t7",
          "type": "subflow"
        },
        {
          "timeRange": [9,10],
          "name": "t8",
          "type": "subflow"
        },
        {
          "timeRange": [15,16],
          "name": "t9",
          "type": "subflow"
        },
        {
          "timeRange": [19,20],
          "name": "t10",
          "type": "subflow"
        },
        {
          "timeRange": [22,23],
          "name": "t11",
          "type": "subflow"
        },
        {
          "timeRange": [26,27],
          "name": "t12",
          "type": "subflow"
        },
        {
          "timeRange": [29,30],
          "name": "t13",
          "type": "subflow"
        },
        {
          "timeRange": [33,34],
          "name": "t14",
          "type": "subflow"
        },
        {
          "timeRange": [36,37],
          "name": "t15",
          "type": "subflow"
        }
      ]
    },
    {
      "worker": "worker 3",
      "data":[
        {
          "timeRange": [4,5],
          "name": "t16",
          "type": "condition"
        },
        {
          "timeRange": [9,13],
          "name": "t17",
          "type": "condition"
        },
        {
          "timeRange": [15,20],
          "name": "t18",
          "type": "condition"
        },
        {
          "timeRange": [22,27],
          "name": "t19",
          "type": "condition"
        },
        {
          "timeRange": [29,30],
          "name": "t21",
          "type": "condition"
        },
        {
          "timeRange": [33,34],
          "name": "t22",
          "type": "condition"
        },
        {
          "timeRange": [36,40],
          "name": "t23",
          "type": "condition"
        }
      ]
    }
  ]
},
{
  "executor": "executor 1",
  "data": [
    {
      "worker": "worker 1",
      "data": [
        {
          "timeRange": [4,5],
          "name": "t24",
          "type": "cudaflow"
        },
        {
          "timeRange": [9,10],
          "name": "t25",
          "type": "cudaflow"
        },
        {
          "timeRange": [15,16],
          "name": "t26",
          "type": "cudaflow"
        },
        {
          "timeRange": [22,23],
          "name": "t27",
          "type": "cudaflow"
        },
        {
          "timeRange": [25,26],
          "name": "t28",
          "type": "cudaflow"
        },
        {
          "timeRange": [29,30],
          "name": "t29",
          "type": "cudaflow"
        },
        {
          "timeRange": [33,34],
          "name": "t30",
          "type": "cudaflow"
        },
        {
          "timeRange": [36,37],
          "name": "t31",
          "type": "cudaflow"
        }
      ]
    },
    {
      "worker": "worker 2",
      "data": [
        {
          "timeRange": [4,5],
          "name": "t32",
          "type": "module"
        },
        {
          "timeRange": [9,10],
          "name": "t33",
          "type": "module"
        },
        {
          "timeRange": [15,16],
          "name": "t34",
          "type": "module"
        },
        {
          "timeRange": [22,23],
          "name": "t35",
          "type": "module"
        },
        {
          "timeRange": [26,27],
          "name": "t36",
          "type": "module"
        },
        {
          "timeRange": [29,34],
          "name": "t37",
          "type": "module"
        },
        {
          "timeRange": [36,37],
          "name": "t38",
          "type": "module"
        }
      ]
    }
  ]
}

]
