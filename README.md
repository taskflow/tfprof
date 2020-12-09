# TFProf

TFProf provides the visualization and tooling needed for profiling 
Taskflow programs 

# Profile Your Taskflow Program

All taskflow programs come with a lightweight profiling module 
to observe worker activities in every executor.
To enable the profiler, set the environment variable `TF_ENABLE_PROFILER` 
to a file name in which the profiling result will be stored.

```bash
~$ TF_ENABLE_PROFILER=result.json ./path/to/my/taskflow/program arg1 arg2
~$ cat result.json
[ ... JSON data ]
```

Paste the content of `result.json` to the bottom JSON text area at the following page:

<p align="center">
   <a href="https://taskflow.github.io/tfprof/">
     <img width="100%" src="images/mainboard.png">
   </a>
</p>

You may also open [index.html](index.html) from your browser to visualize tfprof data.

# Learn More about TFProf

Please visit the page [Profile Taskflow Programs](https://taskflow.github.io/taskflow/Profiler.html).

---

[taskflow]:    https://github.com/taskflow/taskflow
