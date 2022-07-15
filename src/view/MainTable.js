import { useEffect, useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import Slider from '@mui/material/Slider';

import { LineChart, Line, XAxis, YAxis, Legend, Tooltip, ReferenceLine } from 'recharts';

import Matrix from '../model/matrix'
import { T_norm, S_norm } from '../model/T-norm'

import './MainTable.css'

import InputMatrix from './InputMatrix'
import DisplayMatrix from './DisplayMatrix'
import { Box, Input } from '@mui/material';

function createData(
    consept,
    cons_system_on_concept,
    dis_system_on_concept,
    cons_concept_on_system,
    dis_concept_on_system,
    infl_system_on_concept,
    infl_concept_on_system
  ) {
    return { consept, cons_system_on_concept, dis_system_on_concept, cons_concept_on_system, dis_concept_on_system, infl_system_on_concept, infl_concept_on_system };
  }
 

function validate(matrix) {
    let n = matrix.length;
    let new_data = [];
    for (let i = 0; i < n; i++)
    {
      new_data[i] = []; 
      for (let j = 0; j < matrix[i].length; j++)
      {
        let parsed = parseFloat(matrix[i][j]);
        if (isNaN(parsed)) {
          return {"parsed": [], "isValid": false};
        }
        new_data[i][j] = parsed;
      }
    }
    return {"parsed": new_data, "isValid": true};
  }

function MainTable({data, concept_list}) {
    const n = concept_list.length;
    const [value, setValue] = useState(15);

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };
    const [concepts, setConcepts] = useState(() => {
        let d = {}
        concept_list.forEach(concept => d[concept] = 0)
        return d
    })

    useEffect(() => {
        let d = {}
        concept_list.forEach(concept => d[concept] = 0)
        setConcepts(d)
    }, [concept_list])

    console.log(data, concept_list)
    var {parsed, isValid} = validate(data);
    if (isValid) {
        // step 1
        let A = new Matrix(n, n, parsed);
        let {res: B, steps: steps1} = A.toOddMap();
        // step 2
        let {res: C, steps: steps2} = B.transitive_closure();
        // step 3
        let {res: D, steps: steps3} = C.positive_negative();
        
        // step 4
        let {res: cons, steps: steps4_1} = D.get_consonans_matrix();
        let {res: dis, steps: steps4_2} = D.get_disonans_matrix();
        let {res: infl, steps: steps4_3} = D.get_influence_matrix();
    
        let cons_system_on_concept = Matrix.transpose(cons.data).map((el) => el.reduce((partialSum, a) => partialSum + a, 0)/cons.rows_count);
        let dis_system_on_concept = cons_system_on_concept.map(el => 1 -el);
        
        let cons_concept_on_system = cons.data.map((el) => el.reduce((partialSum, a) => partialSum + a, 0)/cons.rows_count);
        let dis_concept_on_system = cons_concept_on_system.map(el => 1 -el);
    
        let infl_concept_on_system = Matrix.transpose(infl.data).map((el) => el.reduce((partialSum, a) => partialSum + a, 0)/cons.rows_count);
        let infl_system_on_concept = infl.data.map((el) => el.reduce((partialSum, a) => partialSum + a, 0)/cons.rows_count);

        let rows = []
        for (let i = 0; i < Object.keys(parsed).length; i++) {
        rows.push(createData(
            Object.keys(concepts)[i],
            Number(cons_system_on_concept[i]).toFixed(2),
            Number(dis_system_on_concept[i]).toFixed(2),
            Number(cons_concept_on_system[i]).toFixed(2),
            Number(dis_concept_on_system[i]).toFixed(2),
            Number(infl_system_on_concept[i]).toFixed(2),
            Number(infl_concept_on_system[i]).toFixed(2)
        ));
        }

        // modeling
        
        let modeling_data = [{}];
        const keys = Object.keys(concepts);
        let is_valid = true;
        for (var k = 0; k < keys.length; k++) {
        modeling_data[0][keys[k]] = 0;
        if (concepts[keys[k]] == undefined) {
            is_valid = false
        }
        }

        if (is_valid) {
        modeling_data.push(concepts);
        let t = 1
        let toStop = false;
        let toSmall = true;
        // console.log(concepts)
        while(!toStop &&  t < 10) {
            modeling_data[t+1] = {}
            toSmall = true;
            for (let i = 0; i < n; i++) {
            // data[t+1][keys[i]] = data[t][keys[i]];
            modeling_data[t+1][keys[i]] = modeling_data[t][keys[i]];
            for (let j = 0; j < n; j++) {
                let delta = modeling_data[t][keys[j]]-modeling_data[t-1][keys[j]];
                if (i == j) { continue; }
                if (Math.abs(delta) > 3) {
                    // console.log('to big')
                    toStop = true;
                }
                // console.log(Math.abs(delta))
                if (Math.abs(delta) > 0.01) {
                    // console.log('not toSmall')
                    toSmall = false;
                }
                // modeling_data[t+1][keys[i]] = S_norm(modeling_data[t+1][keys[i]], T_norm(modeling_data[t][keys[j]]-modeling_data[t-1][keys[j]], A.data[j][i]));
                // modeling_data[t+1][keys[i]] = modeling_data[t+1][keys[i]] + T_norm(modeling_data[t][keys[j]]-modeling_data[t-1][keys[j]], A.data[j][i]);
                // modeling_data[t+1][keys[i]] = modeling_data[t+1][keys[i]] + T_norm(modeling_data[t][keys[j]]-modeling_data[t-1][keys[j]], (modeling_data[t][keys[j]]-modeling_data[t-1][keys[j]]) >= 0 ? D.data[j][i][0] : -D.data[j][i][1]);
                modeling_data[t+1][keys[i]] = modeling_data[t+1][keys[i]] + T_norm(delta, A.data[j][i]);
            }
            }
            // if (toSmall) {

                // console.log('toSmall')
                // break;
            // }
            t++;
        }
        }
        let formated_data = modeling_data.map((row, index) => {
            let rounded = {}
            Object.keys(row).forEach(key => {
            rounded[key] = Number(row[key]).toFixed(2);
            });
            return {"name": index.toString(), ...rounded}
        })
    
        const contrast_colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#000000']  
    


    return (
        <div>
        <Accordion>
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            >
            <Typography>Шаг 1. Перейти к нечетной карте</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <BlockMath math={steps1}/>
            </AccordionDetails>
        </Accordion>
        <Accordion>
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
            >
            <Typography>Шаг 2. Найти транзитивное замыкание</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <BlockMath math={steps2}/>
            </AccordionDetails>
        </Accordion>
        <Accordion>
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3a-content"
            id="panel3a-header"
            >
            <Typography>Шаг 3. Построить "эврестическое" транзитивное замыкание</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <BlockMath math={steps3}/>
            </AccordionDetails>
        </Accordion>
        
        <h2>Системные показатели нечеткой когнитивной карты</h2>
        <Accordion>
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4a-content"
            id="panel4a-header"
            >
            <Typography>Шаг 4. Построить матрицы консонанса, дисонанса и влияния</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <BlockMath math={steps4_1}/>
            <BlockMath math={steps4_2}/>
            <BlockMath math={steps4_3}/>
            </AccordionDetails>
        </Accordion>
        <TableContainer component={Paper}>
        <Table aria-label="simple table">
            <TableHead>
            <TableRow>
                <TableCell>Название Концептов</TableCell>
                <TableCell align="right">Консонанс влияния системы</TableCell>
                <TableCell align="right">Дисонанс влияния системы</TableCell>
                <TableCell align="right">Консонанс влияния концепта</TableCell>
                <TableCell align="right">Дисонанс влияния концепта</TableCell>
                <TableCell align="right">Влияние системы на концепт</TableCell>
                <TableCell align="right">Влияния концепта на систему</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {rows.map((row, index) => (
                <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                <TableCell component="th" scope="row">
                    {row.consept}
                </TableCell>
                <TableCell align="right">{row.cons_system_on_concept}</TableCell>
                <TableCell align="right">{row.dis_system_on_concept}</TableCell>
                <TableCell align="right">{row.cons_concept_on_system}</TableCell>
                <TableCell align="right">{row.dis_concept_on_system}</TableCell>
                <TableCell align="right">{row.infl_concept_on_system}</TableCell>
                <TableCell align="right">{row.infl_system_on_concept}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
        <h2>Прогнозирование</h2>
        <p>Введите значение импульса</p>
        <div id="prediction">
        <ul>
            {Object.keys(concepts).map((el, index) =>
            <li key={index}>
                <input
                    // variant="outlined"
                    type="number"
                    step="0.1"
                    placeholder={concepts[el]}
                    onChange={(e) => {
                let value = e.target.value;
                let new_value = parseFloat(value)
                if (isNaN(new_value)) 
                {
                    setConcepts({...concepts, [el]: 0})
                }
                else {
                    setConcepts({...concepts, [el]: parseFloat(value)})
                }
                }}/>
                <label>{el}</label>
                {/* <a href="" onClick={event => {
                event.preventDefault();
                let new_concepts = [...concepts.slice(0, index), ...concepts.slice(index+1)];
                setConcepts(new_concepts);
                }}> удалить</a> */}
            </li>
            )}
        </ul>
        {/* <Box sx={{ width: 300 }}>
            <Slider
                value={value}
                onChange={handleChange}
                aria-label="Количество шагов"
                defaultValue={30}
                getAriaValueText={el => el}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={5}
                max={10}
            />
        </Box> */}
        {is_valid ? <LineChart width={800} height={500} data={formated_data}>
            <XAxis dataKey="name" domain={[0, 'dataMax']} hide={true}/>
            <YAxis domain={[-5, 5]}/>
            <Tooltip position={ {x: 800, y: 0} }/>
            <Legend />
            <ReferenceLine purpose='fake x axis' y={0} stroke='#666666' />
            {keys.map((el, index) => 
                <Line key={index} type="basic" dataKey={el} stroke={contrast_colors[index]}/>) }
            </LineChart> : <p>Неправильный импульс</p>
        }
        
        </div>
        </div>
        )
    }
}

export default MainTable;