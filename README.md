# TFProf

TFProf provides the visualization and tooling needed for profiling 
Taskflow programs 

# Profile Your Taskflow Program

All taskflow programs come with a lightweight profiling module 
to observe worker activities in every executor.
To enable the profiler, set the environment variable `TF_ENABLE_PROFILER` 
to a file name in which the profiling result will be stored.
Then, drag the output file to [https://taskflow.github.io/tfprof/](https://taskflow.github.io/tfprof/).


```bash
~$ TF_ENABLE_PROFILER=result.tfp ./path/to/my/taskflow/program arg1 arg2
# drag the result.tfp file to https://taskflow.github.io/tfprof/
```

You may also open [index.html](index.html) from your browser to visualize tfprof data.

# Learn More about TFProf

Please visit the page [Profile Taskflow Programs](https://taskflow.github.io/taskflow/Profiler.html).

---

[taskflow]:    https://github.com/taskflow/taskflow
