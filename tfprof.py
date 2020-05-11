# program: tfprof

import time
import json
import argparse
import os
import tempfile
import subprocess

# parse the input arguments
parser = argparse.ArgumentParser();

parser.add_argument(
  '-o', '--output',
  type=str,
  help='file name to save the profiler result',
  default="output.tfp"
)

parser.add_argument('program', nargs=argparse.REMAINDER)

args = parser.parse_args();

tfpb = time.perf_counter(); 

print("profiling program:", ' '.join(args.program))

with open(args.output, "w") as ofs:

  ofs.write('[');

  with tempfile.TemporaryDirectory() as dirname:
  
    prefix = os.path.join(dirname, 'executor-')
  
    os.environ["TF_ENABLE_PROFILER"] = prefix;
    
    prob = time.perf_counter();
    subprocess.call(args.program);
    proe = time.perf_counter();
    print(f"program finished in {(proe - prob)*1000:0.2f} milliseconds")

    executor_id = 0;
    print('collecting profiled data ...')
    for fnum, fname in enumerate(os.listdir(dirname)):
      if fname.endswith(".tfp") : 
        ifile = os.path.join(dirname, fname);
        print("[%d] -> %s" % (fnum, ifile));
        with open(ifile, "r") as ifs:
          data = json.load(ifs);
          data['executor'] = "executor " + str(executor_id);
          executor_id = executor_id + 1;
          if fnum != 0 :
            ofs.write(',');
          #ofs.write(ifs.read());
          json.dump(data, ofs)

  ofs.write(']');

print("saved result to", args.output);

tfpe = time.perf_counter(); 
    
print(f"tfprof finished in {(tfpe - tfpb)*1000:0.2f} milliseconds")











