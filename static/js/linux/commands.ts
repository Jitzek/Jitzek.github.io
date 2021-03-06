function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function removeWhiteSpaceEntries(array: Array<string>) {
  return array.filter(function (str: string) { return /\S/.test(str); })
}

class Command {
  id: string;
  help: string;
  man: Object;
  fs: Filesystem;
  terminal: Terminal;
  forcestop: boolean = false;

  constructor(fs: Filesystem, terminal: Terminal) {
    this.fs = fs;
    this.terminal = terminal;
  };

  async execute(args: Array<any>, user: Object, print: boolean): Promise<any> { }
  print(output: any): void { }
  async stop(): Promise<void> {
    this.forcestop = true;
  }
}

class Cat extends Command {
  id = 'cat';
  help: string = 'concatenate files and print on the standard output';
  man = {};

  constructor(fs: Filesystem, terminal: Terminal) {
    super(fs, terminal);
  }

  execute(args: Array<any>, user: Object = null, print = true): any {
    if (args.length < 1) {
      // Display help
      if (print) this.print('cat: help placeholder text');
      return;
    }

    // Determine additional parameters ('-', '--')

    //

    // Get location of file
    let location = args[0] instanceof mFile || args[0] instanceof mDirectory ? args[0] : this.fs.getLocation(args[0]);

    // Check if location is file
    if (!this.fs.isFile(location)) {
      let output = `cat: cannot open ${args[0]}`;
      if (print) this.print(output);
      return output;
    }

    let output = location.content;

    if (print) this.print(output);

    // Output is content of file
    return output;
  }

  print(output: any) {
    this.terminal.ui.innerHTML += `${this.terminal.tline_start}${output}${this.terminal.tline_end}`;
  }
}

class Clear extends Command {
  id = 'clear';
  help = 'clear the terminal screen';
  man = {};

  constructor(fs: Filesystem, terminal: Terminal) {
    super(fs, terminal);
  }

  async execute(args: string[], user: Object = null, print = false): Promise<any> {
    // Determine additional parameters ('-', '--')

    //
    this.terminal.ui.innerHTML = '';

    //if (print) this.print();

    return false;
  }

  print(output: any = null) {
    return;
  }
}

class Echo extends Command {
  id = 'echo';
  help = 'write arguments to the standard output.';
  man: {};

  constructor(fs: Filesystem, terminal: Terminal) {
    super(fs, terminal);
  }

  /// TODO: -e escape characters
  async execute(args: any[], user: Object = null, print = true): Promise<any> {
    // Determine additional parameters ('-', '--')

    //

    let valid = true;
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] !== "string") {
        valid = false;
        break;
      }
    }

    let output: string = valid ? args.join(' ') : '\xa0';

    if (print) this.print(output);

    return output;
  }

  print(output: any) {
    this.terminal.ui.innerHTML += `${this.terminal.tline_start} ${output} ${this.terminal.tline_end}`;
  }
}

class Help extends Command {
  id: string = 'help';
  help: string = 'display info of supported commands';
  man: Object = {};

  constructor(fs: Filesystem, terminal: Terminal) {
    super(fs, terminal);
  }

  async execute(args: string[], user: Object, print: boolean = true): Promise<any> {
    if (args.length == 0) {
      let output: string[] = [];

      let commands: Command[] = [];
      CommandFactory.command_ids.forEach(id => {
        commands.push(CommandFactory.getCommand(id, this.fs, this.terminal));
      });
      commands.forEach(command => {
        output.push(`${command.id} - ${command.help}`);
      });

      if (print) this.print(output);
      return output;
    }
    if (args.length > 2) {
      let output = 'help: too many arguments';
      if (print) this.print(output);
      return output;
    }
    // Catch argument as command
    let command = CommandFactory.getCommand(args[0], this.fs, this.terminal);
    let output: string;
    if (!command) output = `help: '${args[0]}' is not a supported command`;
    else output = `${command.id} - ${command.help}`;
    if (print) this.print(output);
    return output;
  }

  print(output: any): void {
    if (output instanceof Array) {
      let n_output = '';
      output.forEach(element => { n_output += `${element}<br>`; });
      this.terminal.ui.innerHTML += `${this.terminal.tline_start}${n_output}${this.terminal.tline_end}`;
      return;
    }
    this.terminal.ui.innerHTML += `${this.terminal.tline_start}${output}${this.terminal.tline_end}`;
  }

}

class Ls extends Command {
  id: string = 'ls';
  help: string = 'list directory contents';
  man: Object;

  constructor(fs: Filesystem, terminal: Terminal) {
    super(fs, terminal);
  }

  async execute(args: any[], user: Object, print: boolean): Promise<any> {
    // Determine additional parameters ('-', '--')

    //

    let path = args[0];
    let content: any[];
    let output: string[] = [];
    if (typeof path === 'string') {
      let location: any = this.fs.getLocation(path);
      if (!this.fs.isDirectory(location)) {
        return;
      }
      let directory: mDirectory = location;
      content = directory.getContent();
      content.forEach(e => {
        output.push(e.name);
      });
    } else if (path === 'mDirectory') {

    } else {
      return;
    }
    if (print) this.print(content);
    return;
  }

  print(output: any): void {
    throw new Error("Method not implemented.");
  }
}

class Sudo extends Command {
  id = 'sudo';
  help = 'execute a command as another user';
  man = {};

  sub_command: Command = null;

  constructor(fs: Filesystem, terminal: Terminal) {
    super(fs, terminal);
  }

  async execute(args: string[], user: Object, print = true): Promise<any> {
    if (args.length < 1) {
      // Display help
      if (print) this.print('sudo: help placeholder text');
      return;
    }

    // Do some password checks

    // Execute command as root user
    let command = CommandFactory.getCommand(args[0], this.fs, this.terminal);
    if (!command) {
      if (print) this.print(`sudo: ${args[0]}: command not found`);
    }
    if (command) this.sub_command = command;
    let result = this.sub_command.execute(args.slice(1), user = null /* root */, print = true);
    return result;
  }

  print(output: any): void {
    if (this.sub_command != undefined && this.sub_command != null) {
      this.sub_command.print(output);
      return;
    }
    this.terminal.ui.innerHTML += `${this.terminal.tline_start} ${output} ${this.terminal.tline_end}`;
  }

  async stop(): Promise<void> {
    this.forcestop = true;
    this.sub_command.stop();
  }
}

class CommandFactory {
  static command_ids: string[] = ['cat', 'clear', 'echo', 'help', /*'ls'*/, 'sudo'];
  static command_classes: typeof Command[] = [Cat, Clear, Echo, Help, /*Ls*/, Sudo];

  static getCommand(id: string, filesystem: Filesystem, terminal: Terminal): any {
    let index = this.command_ids.indexOf(id);
    return index != -1 ? new this.command_classes[index](filesystem, terminal) : false;
  }
}